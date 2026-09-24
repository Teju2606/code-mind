import os
import sys
import unittest
import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import database
from database import (
    init_db,
    get_all_meetings_from_db,
    get_all_action_items_from_db,
    insert_meeting_and_actions,
    update_status_in_db
)
from main import (
    extract_action_items_from_transcript,
    apply_carried_over_tracking
)

TEST_DB_PATH = os.path.join(CURRENT_DIR, "test_audit_trail.db")

class TestAuditTrail(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass
        database.DB_FILE = TEST_DB_PATH
        init_db()

    def tearDown(self):
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass

    def test_audit_trail_fields_on_existing_meetings(self):
        """
        Verify that action items in SQLite have all audit trail fields:
        - action
        - owner
        - deadline
        - current status
        - original meeting
        - meeting date
        - previous meeting (when carried over)
        """
        # Create a test meeting
        m_data = {
            "title": "Q3 Architecture Review",
            "date": "2026-09-20",
            "department": "Engineering",
            "transcript": "Marcus Vance: I will finalize the API documentation by 2026-10-05."
        }
        items = extract_action_items_from_transcript(m_data["transcript"], m_data["date"], m_data["title"])
        insert_meeting_and_actions(m_data, items)

        meetings = get_all_meetings_from_db()
        self.assertGreater(len(meetings), 0, "Meeting must exist in SQLite")

        actions = get_all_action_items_from_db()
        self.assertGreater(len(actions), 0, "Action items must exist in SQLite")

        print(f"\n[Audit Trail Field Verification ({len(actions)} actions)]:")
        for a in actions:
            # 1. Action
            self.assertTrue(bool(a.get("action")), "Action text is required")
            # 2. Owner
            self.assertTrue(bool(a.get("owner")), "Owner is required")
            # 3. Deadline
            self.assertTrue(bool(a.get("deadline")), "Deadline is required")
            # 4. Status
            self.assertIn(a.get("status"), ["NEW", "CARRIED_OVER", "CARRIED OVER", "OVERDUE", "COMPLETED"])
            # 5. Original meeting
            self.assertTrue(bool(a.get("originalMeeting") or a.get("meetingTitle")), "Original meeting title is required")
            # 6. Meeting date
            self.assertTrue(bool(a.get("originalMeetingDate") or a.get("meetingDate")), "Meeting date is required")

            print(f"  [OK] Action: '{a['action'][:40]}...' | Owner: {a['owner']} | Deadline: {a['deadline']} | Status: {a['status']} | Orig Mtg: {a['originalMeeting']} ({a['originalMeetingDate']})")

    def test_audit_trail_carried_over_with_previous_meeting(self):
        """
        Verify that when an action is carried over to a new meeting:
        - status becomes CARRIED_OVER
        - original meeting and meeting date are preserved
        - previous meeting and date are preserved
        """
        # Meeting 1
        m1_data = {
            "title": "Sprint 1 Kickoff Sync",
            "date": "2026-09-01",
            "department": "Engineering",
            "transcript": "Marcus Vance: I will implement the zero-trust network gateway by 2026-10-10."
        }
        raw_items_1 = extract_action_items_from_transcript(m1_data["transcript"], m1_data["date"], m1_data["title"])
        items_1 = apply_carried_over_tracking(raw_items_1, get_all_action_items_from_db())
        m1, a1 = insert_meeting_and_actions(m1_data, items_1)

        marcus_m1 = next(a for a in a1 if "Marcus" in a["owner"])
        self.assertEqual(marcus_m1["originalMeeting"], "Sprint 1 Kickoff Sync")
        self.assertEqual(marcus_m1["originalMeetingDate"], "2026-09-01")

        # Meeting 2 - task not completed, carried over (with future deadline)
        m2_data = {
            "title": "Sprint 2 Progress Review",
            "date": "2026-09-15",
            "department": "Engineering",
            "transcript": "Marcus Vance: I will implement the zero-trust network gateway by 2026-10-22."
        }
        raw_items_2 = extract_action_items_from_transcript(m2_data["transcript"], m2_data["date"], m2_data["title"])
        items_2 = apply_carried_over_tracking(raw_items_2, get_all_action_items_from_db())
        m2, a2 = insert_meeting_and_actions(m2_data, items_2)

        marcus_m2 = next(a for a in a2 if "Marcus" in a["owner"])

        # Assertions for audit trail
        self.assertEqual(marcus_m2["status"], "CARRIED_OVER")
        self.assertEqual(marcus_m2["originalMeeting"], "Sprint 1 Kickoff Sync")
        self.assertEqual(marcus_m2["originalMeetingDate"], "2026-09-01")
        self.assertEqual(marcus_m2["previousMeeting"], "Sprint 1 Kickoff Sync")
        self.assertEqual(marcus_m2["previousMeetingDate"], "2026-09-01")

        print("\n[Carried-Over Audit Trail Check]:")
        print(f"  - Action: {marcus_m2['action']}")
        print(f"  - Owner: {marcus_m2['owner']}")
        print(f"  - Deadline: {marcus_m2['deadline']}")
        print(f"  - Current Status: {marcus_m2['status']}")
        print(f"  - Original Meeting: {marcus_m2['originalMeeting']} ({marcus_m2['originalMeetingDate']})")
        print(f"  - Previous Meeting: {marcus_m2['previousMeeting']} ({marcus_m2['previousMeetingDate']})")

if __name__ == "__main__":
    unittest.main()
