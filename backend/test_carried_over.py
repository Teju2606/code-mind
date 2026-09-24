import os
import sys
import unittest
import sqlite3

# Ensure backend directory is in python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import database
from database import (
    init_db,
    get_connection,
    get_all_meetings_from_db,
    get_all_action_items_from_db,
    insert_meeting_and_actions,
    update_status_in_db
)
from main import (
    extract_action_items_from_transcript,
    apply_carried_over_tracking,
    find_matching_previous_action,
    normalize_action_for_matching
)

TEST_DB_PATH = os.path.join(CURRENT_DIR, "test_database.db")

class TestCarriedOverTracking(unittest.TestCase):
    def setUp(self):
        # Point to isolated test database
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

    def test_carried_over_flow_with_two_meetings(self):
        print("\n========================================================")
        print("TEST: 2 Meetings Carried-Over Tracking")
        print("========================================================")

        # ----------------------------------------------------
        # 1. PROCESS MEETING 1 (Sprint 1)
        # ----------------------------------------------------
        meeting_1_data = {
            "title": "Sprint 1 Architecture Alignment",
            "date": "2026-09-20",
            "department": "Engineering",
            "transcript": "Manager: Lalitha will complete the backend API integration tomorrow."
        }

        # Extract items for Meeting 1
        raw_items_1 = extract_action_items_from_transcript(
            meeting_1_data["transcript"],
            meeting_1_data["date"],
            meeting_1_data["title"]
        )
        existing_items_db = get_all_action_items_from_db()
        items_1 = apply_carried_over_tracking(raw_items_1, existing_items_db)

        meeting_1, actions_1 = insert_meeting_and_actions(meeting_1_data, items_1)
        
        print(f"\n[Meeting 1 Created]: '{meeting_1['title']}' (ID: {meeting_1['id']})")
        for a in actions_1:
            print(f"  - Action: '{a['action']}' | Owner: {a['owner']} | Status: {a['status']} | Meeting: {a['meetingTitle']}")

        # Find Lalitha's action from Meeting 1
        lalitha_m1 = next(a for a in actions_1 if a["owner"] == "Lalitha")
        self.assertIn(lalitha_m1["status"], ("NEW", "OVERDUE"))
        self.assertEqual(lalitha_m1["meetingTitle"], "Sprint 1 Architecture Alignment")

        # ----------------------------------------------------
        # 2. PROCESS MEETING 2 (Sprint 2) - previous task NOT completed
        # ----------------------------------------------------
        # The same action appears in Meeting 2 while Meeting 1's action is still 'NEW' (not COMPLETED)
        meeting_2_data = {
            "title": "Sprint 2 Architecture Alignment",
            "date": "2026-09-27",
            "department": "Engineering",
            "transcript": "Manager: Lalitha will complete the backend API integration tomorrow."
        }

        raw_items_2 = extract_action_items_from_transcript(
            meeting_2_data["transcript"],
            meeting_2_data["date"],
            meeting_2_data["title"]
        )
        existing_items_db_2 = get_all_action_items_from_db()
        items_2 = apply_carried_over_tracking(raw_items_2, existing_items_db_2)

        meeting_2, actions_2 = insert_meeting_and_actions(meeting_2_data, items_2)

        print(f"\n[Meeting 2 Created]: '{meeting_2['title']}' (ID: {meeting_2['id']})")
        for a in actions_2:
            print(f"  - Action: '{a['action']}' | Owner: {a['owner']} | Status: {a['status']} | Meeting: {a['meetingTitle']}")

        lalitha_m2 = next(a for a in actions_2 if a["owner"] == "Lalitha")

        # ASSERTIONS FOR CARRIED_OVER:
        # 1. Mark new action as CARRIED_OVER
        self.assertEqual(lalitha_m2["status"], "CARRIED_OVER", "New action must be marked as CARRIED_OVER")
        
        # 2. Keep the original meeting/source
        self.assertEqual(lalitha_m2["meetingTitle"], "Sprint 1 Architecture Alignment", "Must keep original meeting title")
        self.assertEqual(lalitha_m2["meetingDate"], "2026-09-20", "Must keep original meeting date")
        self.assertIn("Manager: Lalitha will complete the backend API integration tomorrow", lalitha_m2["sourceSnippet"])
        
        # 3. Status is CARRIED_OVER in database when fetched
        all_actions = get_all_action_items_from_db()
        fetched_m2_item = next(i for i in all_actions if i["id"] == lalitha_m2["id"])
        self.assertEqual(fetched_m2_item["status"], "CARRIED_OVER")
        self.assertEqual(fetched_m2_item["meetingTitle"], "Sprint 1 Architecture Alignment")

        print("\n--> Verification 1 PASSED: Uncompleted previous action correctly marked as CARRIED_OVER with original source preserved!")

        # ----------------------------------------------------
        # 3. COMPLETE PREVIOUS ACTION & PROCESS MEETING 3
        # ----------------------------------------------------
        # Update both previous occurrences to COMPLETED
        update_status_in_db(lalitha_m1["id"], "COMPLETED")
        update_status_in_db(lalitha_m2["id"], "COMPLETED")

        meeting_3_data = {
            "title": "Sprint 3 Architecture Alignment",
            "date": "2026-10-04",
            "department": "Engineering",
            "transcript": "Lalitha: I will complete the backend API integration tomorrow."
        }

        raw_items_3 = extract_action_items_from_transcript(
            meeting_3_data["transcript"],
            meeting_3_data["date"],
            meeting_3_data["title"]
        )
        existing_items_db_3 = get_all_action_items_from_db()
        items_3 = apply_carried_over_tracking(raw_items_3, existing_items_db_3)

        meeting_3, actions_3 = insert_meeting_and_actions(meeting_3_data, items_3)

        print(f"\n[Meeting 3 Created after COMPLETED status]: '{meeting_3['title']}' (ID: {meeting_3['id']})")
        for a in actions_3:
            print(f"  - Action: '{a['action']}' | Owner: {a['owner']} | Status: {a['status']} | Meeting: {a['meetingTitle']}")

        lalitha_m3 = next(a for a in actions_3 if a["owner"] == "Lalitha")

        # ASSERTION FOR COMPLETED PREVIOUS:
        # If previous action is COMPLETED, treat new action as NEW
        self.assertEqual(lalitha_m3["status"], "NEW", "If previous was COMPLETED, new action must be NEW")
        self.assertEqual(lalitha_m3["meetingTitle"], "Sprint 3 Architecture Alignment", "Treated as new meeting")

        print("\n--> Verification 2 PASSED: If previous action is COMPLETED, treated as NEW!")
        print("\nALL CARRIED_OVER TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    unittest.main()
