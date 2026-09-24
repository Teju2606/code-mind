import os
import sys
import unittest
import sqlite3
import datetime

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
    update_status_in_db,
    check_and_update_overdue_items
)

TEST_DB_PATH = os.path.join(CURRENT_DIR, "test_status_db.db")

class TestActionStatusUpdates(unittest.TestCase):
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

    def test_overdue_automatic_update_rule(self):
        """
        Rule 1: If deadline has passed and status is not COMPLETED -> OVERDUE
        """
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        past_date = (datetime.date.today() - datetime.timedelta(days=5)).strftime("%Y-%m-%d")
        future_date = (datetime.date.today() + datetime.timedelta(days=5)).strftime("%Y-%m-%d")

        meeting_data = {
            "title": "Status Automation Test Sync",
            "date": today_str,
            "department": "Engineering",
            "transcript": "Test transcript"
        }

        actions = [
            {
                "action": "Past deadline with NEW status",
                "owner": "Alice",
                "deadline": past_date,
                "status": "NEW"
            },
            {
                "action": "Past deadline with CARRIED_OVER status",
                "owner": "Bob",
                "deadline": past_date,
                "status": "CARRIED_OVER"
            },
            {
                "action": "Past deadline with COMPLETED status",
                "owner": "Charlie",
                "deadline": past_date,
                "status": "COMPLETED"
            },
            {
                "action": "Future deadline with NEW status",
                "owner": "David",
                "deadline": future_date,
                "status": "NEW"
            },
            {
                "action": "Unspecified deadline with NEW status",
                "owner": "Eve",
                "deadline": "Not specified",
                "status": "NEW"
            }
        ]

        created_meeting, created_actions = insert_meeting_and_actions(meeting_data, actions)
        
        # Verify in DB
        db_items = get_all_action_items_from_db()
        items_by_owner = {i["owner"]: i for i in db_items}

        # 1. Past deadline + NEW -> OVERDUE
        self.assertEqual(items_by_owner["Alice"]["status"], "OVERDUE", "Past deadline item must be OVERDUE")

        # 2. Past deadline + CARRIED_OVER -> OVERDUE
        self.assertEqual(items_by_owner["Bob"]["status"], "OVERDUE", "Past deadline CARRIED_OVER item must be OVERDUE")

        # 3. Past deadline + COMPLETED -> Remains COMPLETED
        self.assertEqual(items_by_owner["Charlie"]["status"], "COMPLETED", "Completed item must stay COMPLETED even if deadline passed")

        # 4. Future deadline + NEW -> Remains NEW
        self.assertEqual(items_by_owner["David"]["status"], "NEW", "Future deadline item must stay NEW")

        # 5. Unspecified deadline -> Remains NEW
        self.assertEqual(items_by_owner["Eve"]["status"], "NEW", "Unspecified deadline item must stay NEW")

    def test_all_four_statuses_and_sqlite_persistence(self):
        """
        Rule 2 & 3: Test all 4 statuses (NEW, CARRIED_OVER, OVERDUE, COMPLETED) and verify persistence in SQLite.
        """
        future_date = (datetime.date.today() + datetime.timedelta(days=10)).strftime("%Y-%m-%d")
        meeting_data = {
            "title": "Four Statuses Test Sync",
            "date": datetime.date.today().strftime("%Y-%m-%d"),
            "department": "QA",
            "transcript": "Test transcript"
        }
        actions = [
            {"action": "Test Action Item", "owner": "Lalit", "deadline": future_date, "status": "NEW"}
        ]
        created_meeting, created_actions = insert_meeting_and_actions(meeting_data, actions)
        action_id = created_actions[0]["id"]

        # 1. Test NEW
        update_status_in_db(action_id, "NEW")
        all_items = get_all_action_items_from_db()
        item = next(i for i in all_items if i["id"] == action_id)
        self.assertEqual(item["status"], "NEW")

        # 2. Test CARRIED_OVER
        update_status_in_db(action_id, "CARRIED_OVER")
        all_items = get_all_action_items_from_db()
        item = next(i for i in all_items if i["id"] == action_id)
        self.assertEqual(item["status"], "CARRIED_OVER")

        # 3. Test OVERDUE
        update_status_in_db(action_id, "OVERDUE")
        all_items = get_all_action_items_from_db()
        item = next(i for i in all_items if i["id"] == action_id)
        self.assertEqual(item["status"], "OVERDUE")

        # 4. Test COMPLETED (saved to SQLite)
        update_status_in_db(action_id, "COMPLETED")
        all_items = get_all_action_items_from_db()
        item = next(i for i in all_items if i["id"] == action_id)
        self.assertEqual(item["status"], "COMPLETED")

        # Direct SQLite connection verification
        conn = get_connection()
        c = conn.cursor()
        clean_id = int(str(action_id).replace("act-", ""))
        c.execute("SELECT status FROM action_items WHERE id = ?", (clean_id,))
        row = c.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row["status"], "COMPLETED")

    def test_dashboard_counts_update(self):
        """
        Rule 4: Dashboard counts update accurately based on SQLite records for all 4 statuses.
        """
        future_date = (datetime.date.today() + datetime.timedelta(days=10)).strftime("%Y-%m-%d")
        past_date = (datetime.date.today() - datetime.timedelta(days=5)).strftime("%Y-%m-%d")

        meeting_data = {
            "title": "Dashboard Metrics Sync",
            "date": datetime.date.today().strftime("%Y-%m-%d"),
            "department": "Product",
            "transcript": "Test transcript"
        }
        actions = [
            {"action": "Action 1", "owner": "U1", "deadline": future_date, "status": "NEW"},
            {"action": "Action 2", "owner": "U2", "deadline": future_date, "status": "CARRIED_OVER"},
            {"action": "Action 3", "owner": "U3", "deadline": past_date, "status": "NEW"}, # Will become OVERDUE
            {"action": "Action 4", "owner": "U4", "deadline": future_date, "status": "COMPLETED"},
        ]
        insert_meeting_and_actions(meeting_data, actions)

        # Retrieve items
        action_items = get_all_action_items_from_db()
        
        # Total created items = 4 (plus any seed data if initialized)
        count_new = len([i for i in action_items if i["status"] == "NEW"])
        count_carried = len([i for i in action_items if i["status"] in ("CARRIED_OVER", "CARRIED OVER")])
        count_overdue = len([i for i in action_items if i["status"] == "OVERDUE"])
        count_completed = len([i for i in action_items if i["status"] == "COMPLETED"])

        # Check that we have items in all 4 categories
        self.assertGreaterEqual(count_new, 1)
        self.assertGreaterEqual(count_carried, 1)
        self.assertGreaterEqual(count_overdue, 1)
        self.assertGreaterEqual(count_completed, 1)

if __name__ == "__main__":
    unittest.main()
