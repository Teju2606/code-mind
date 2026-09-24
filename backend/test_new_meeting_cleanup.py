import urllib.request
import urllib.parse
import json
import datetime
import unittest

class TestNewMeetingCreationAndEmptyStates(unittest.TestCase):
    def setUp(self):
        self.base_url = "http://127.0.0.1:8001/api"
        # Reset DB before test
        import sqlite3
        conn = sqlite3.connect('backend/database.db')
        c = conn.cursor()
        c.execute('DELETE FROM action_items')
        c.execute('DELETE FROM meetings')
        conn.commit()
        conn.close()

    def test_flow(self):
        print("\n" + "=" * 60)
        print("TEST: Clean SQLite Database & New Meeting Creation")
        print("=" * 60)

        # 1. Verify Initial Empty State
        req_meetings = urllib.request.Request(f"{self.base_url}/meetings")
        with urllib.request.urlopen(req_meetings) as resp:
            initial_meetings = json.loads(resp.read().decode())
        
        req_actions = urllib.request.Request(f"{self.base_url}/action-items")
        with urllib.request.urlopen(req_actions) as resp:
            initial_actions = json.loads(resp.read().decode())

        print(f"[Initial SQLite State]: {len(initial_meetings)} meetings, {len(initial_actions)} action items")
        self.assertEqual(len(initial_meetings), 0, "Database should start with 0 meetings")
        self.assertEqual(len(initial_actions), 0, "Database should start with 0 action items")

        # 2. Create a Real New Meeting
        new_meeting_payload = {
            "title": "Production Deployment & Security Audit",
            "date": "2026-09-25",
            "department": "Engineering",
            "transcript": """[00:02:15] Sarah Chen: We need to finalize the payment webhook security patch before next week.
[00:03:00] Marcus Vance: I will deploy the payment webhook HMAC verification patch by 2026-09-28.
[00:05:20] David Kim: I commit to running the load tests on the cluster by 2026-09-30."""
        }

        req_create = urllib.request.Request(
            f"{self.base_url}/meetings/process",
            data=json.dumps(new_meeting_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_create) as resp:
            create_res = json.loads(resp.read().decode())

        created_m = create_res["meeting"]
        created_a = create_res["actionItems"]

        print(f"\n[Meeting Created]: '{created_m['title']}' (Date: {created_m['date']})")
        print(f"Extracted {len(created_a)} action items:")
        for a in created_a:
            print(f"  - Action: '{a['action']}'")
            print(f"    Owner: {a['owner']} | Deadline: {a['deadline']} | Status: {a['status']}")
            print(f"    Original Meeting: '{a['originalMeeting']}' ({a['originalMeetingDate']})")

        self.assertEqual(created_m["title"], "Production Deployment & Security Audit")
        self.assertEqual(len(created_a), 3)

        marcus_item = next(i for i in created_a if "Marcus" in i["owner"])
        self.assertEqual(marcus_item["deadline"], "2026-09-28")
        self.assertEqual(marcus_item["status"], "NEW")
        self.assertEqual(marcus_item["originalMeeting"], "Production Deployment & Security Audit")
        self.assertEqual(marcus_item["originalMeetingDate"], "2026-09-25")

        david_item = next(i for i in created_a if "David" in i["owner"])
        self.assertEqual(david_item["deadline"], "2026-09-30")
        self.assertEqual(david_item["status"], "NEW")
        self.assertEqual(david_item["originalMeeting"], "Production Deployment & Security Audit")
        self.assertEqual(david_item["originalMeetingDate"], "2026-09-25")

        # 3. Verify Database GET /api/meetings and GET /api/action-items
        with urllib.request.urlopen(f"{self.base_url}/meetings") as resp:
            db_meetings = json.loads(resp.read().decode())
        self.assertEqual(len(db_meetings), 1)
        self.assertEqual(db_meetings[0]["title"], "Production Deployment & Security Audit")

        with urllib.request.urlopen(f"{self.base_url}/action-items") as resp:
            db_actions = json.loads(resp.read().decode())
        self.assertEqual(len(db_actions), 3)

        # 4. Verify Dashboard Stats
        with urllib.request.urlopen(f"{self.base_url}/dashboard/stats") as resp:
            stats = json.loads(resp.read().decode())
        print(f"\n[Updated Dashboard Stats from SQLite]: {stats}")
        self.assertEqual(stats["totalMeetings"], 1)
        self.assertEqual(stats["totalActionItems"], 3)
        self.assertEqual(stats["countNew"], 3)

        # 5. Update status of Marcus's action to COMPLETED
        patch_req = urllib.request.Request(
            f"{self.base_url}/action-items/{marcus_item['id']}/status",
            data=json.dumps({"status": "COMPLETED"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH"
        )
        with urllib.request.urlopen(patch_req) as resp:
            patch_res = json.loads(resp.read().decode())
        self.assertTrue(patch_res["success"])

        with urllib.request.urlopen(f"{self.base_url}/dashboard/stats") as resp:
            updated_stats = json.loads(resp.read().decode())
        self.assertEqual(updated_stats["countCompleted"], 1)
        self.assertEqual(updated_stats["countNew"], 2)

        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    unittest.main()
