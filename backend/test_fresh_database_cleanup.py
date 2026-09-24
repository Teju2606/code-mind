import os
import sys
import unittest
import sqlite3
import datetime
import json

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
    apply_carried_over_tracking
)

TEST_DB_PATH = os.path.join(CURRENT_DIR, "test_fresh_db.db")

class TestFreshDatabaseAndCleanup(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass
        database.DB_FILE = TEST_DB_PATH

    def tearDown(self):
        if os.path.exists(TEST_DB_PATH):
            try:
                os.remove(TEST_DB_PATH)
            except Exception:
                pass

    def test_fresh_database_starts_empty(self):
        """Verify that init_db() creates schema and starts with 0 meetings and 0 action items."""
        init_db()
        
        # Verify seed_initial_data function does NOT exist in database module
        self.assertFalse(hasattr(database, "seed_initial_data"), "seed_initial_data function should be removed")

        # Verify DB is 100% empty
        meetings = get_all_meetings_from_db()
        action_items = get_all_action_items_from_db()

        self.assertEqual(len(meetings), 0, "Fresh database must have 0 meetings")
        self.assertEqual(len(action_items), 0, "Fresh database must have 0 action items")

    def test_new_meeting_and_action_item_extraction(self):
        """Verify that a newly created meeting extracts and persists real data."""
        init_db()
        meeting_date = "2026-09-25"
        meeting_title = "Sprint 14 Planning & Security Architecture"
        transcript = """[00:01:10] Alice Johnson: I will deploy the database migration script by 2026-09-28.
[00:03:45] Bob Smith: I commit to testing all OAuth endpoints by tomorrow.
[00:06:00] Charlie Brown: I will update the audit log documentation by 2026-10-02."""

        # 1. Extract action items
        extracted = extract_action_items_from_transcript(transcript, meeting_date, meeting_title)
        self.assertEqual(len(extracted), 3)

        # Alice Johnson item
        alice_item = next(i for i in extracted if i["owner"] == "Alice Johnson")
        self.assertEqual(alice_item["deadline"], "2026-09-28")
        self.assertEqual(alice_item["status"], "NEW")
        self.assertEqual(alice_item.get("confidence", ""), "")

        # Bob Smith item (deadline calculated from meeting_date + 1 day = 2026-09-26)
        bob_item = next(i for i in extracted if i["owner"] == "Bob Smith")
        self.assertEqual(bob_item["deadline"], "2026-09-26")

        # 2. Insert into SQLite
        meeting_payload = {
            "title": meeting_title,
            "date": meeting_date,
            "department": "Engineering",
            "transcript": transcript,
            "summary": "Sprint 14 planning meeting",
            "attendees": ["Alice Johnson", "Bob Smith", "Charlie Brown"]
        }
        created_meeting, created_actions = insert_meeting_and_actions(meeting_payload, extracted)

        # 3. Verify SQLite persistence
        db_meetings = get_all_meetings_from_db()
        db_actions = get_all_action_items_from_db()

        self.assertEqual(len(db_meetings), 1)
        self.assertEqual(db_meetings[0]["title"], meeting_title)
        self.assertEqual(len(db_actions), 3)

        for act in db_actions:
            self.assertEqual(act["originalMeeting"], meeting_title)
            self.assertEqual(act["originalMeetingDate"], meeting_date)

    def test_audit_trail_and_carried_over_tracking(self):
        """Verify carried-over tracking records original and previous meetings properly."""
        init_db()

        # Meeting 1
        m1_payload = {
            "title": "Meeting 1 - Sprint Review",
            "date": "2026-09-20",
            "department": "Core Platform",
            "transcript": "[00:01:00] Alice Johnson: I will optimize the Redis caching layer by 2026-09-30."
        }
        actions_m1 = extract_action_items_from_transcript(m1_payload["transcript"], m1_payload["date"], m1_payload["title"])
        created_m1, created_a1 = insert_meeting_and_actions(m1_payload, actions_m1)
        self.assertEqual(created_a1[0]["status"], "NEW")

        # Meeting 2 mentions the same incomplete task
        m2_payload = {
            "title": "Meeting 2 - Sprint Checkin",
            "date": "2026-09-25",
            "department": "Core Platform",
            "transcript": "[00:02:00] Alice Johnson: I will optimize the Redis caching layer by 2026-10-05."
        }
        actions_m2_raw = extract_action_items_from_transcript(m2_payload["transcript"], m2_payload["date"], m2_payload["title"])
        existing_items = get_all_action_items_from_db()
        actions_m2_tracked = apply_carried_over_tracking(actions_m2_raw, existing_items)

        created_m2, created_a2 = insert_meeting_and_actions(m2_payload, actions_m2_tracked)

        # Check carried over action properties
        item = created_a2[0]
        self.assertEqual(item["status"], "CARRIED_OVER")
        self.assertEqual(item["originalMeeting"], "Meeting 1 - Sprint Review")
        self.assertEqual(item["originalMeetingDate"], "2026-09-20")
        self.assertEqual(item["previousMeeting"], "Meeting 1 - Sprint Review")
        self.assertEqual(item["previousMeetingDate"], "2026-09-20")

        # Update status to COMPLETED
        update_status_in_db(item["id"], "COMPLETED")
        all_actions = get_all_action_items_from_db()
        updated_item = next(i for i in all_actions if i["id"] == item["id"])
        self.assertEqual(updated_item["status"], "COMPLETED")

if __name__ == "__main__":
    unittest.main()
