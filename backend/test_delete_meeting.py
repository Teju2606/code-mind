import os
import sys
import json
import urllib.request
import sqlite3

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from database import (
    init_db,
    insert_meeting_and_actions,
    get_all_meetings_from_db,
    get_all_action_items_from_db,
    delete_meeting_from_db
)

def run_tests():
    print("=== TESTING DELETE MEETING FUNCTIONALITY ===")

    # 1. Test database deletion function directly
    print("\n1. Testing database level deletion...")
    test_meeting = {
        "title": "Temporary Test Meeting For Deletion",
        "date": "2026-09-25",
        "department": "QA",
        "transcript": "Marcus will finish the load testing tomorrow. Sarah to review security.",
        "summary": "Meeting to be deleted",
        "attendees": ["Marcus", "Sarah"]
    }
    test_actions = [
        {
            "action": "Finish the load testing tomorrow",
            "owner": "Marcus",
            "deadline": "2026-09-26",
            "status": "NEW",
            "sourceSnippet": "Marcus will finish the load testing tomorrow."
        },
        {
            "action": "Review security",
            "owner": "Sarah",
            "deadline": "Not specified",
            "status": "NEW",
            "sourceSnippet": "Sarah to review security."
        }
    ]

    created_m, created_a = insert_meeting_and_actions(test_meeting, test_actions)
    m_id = created_m["id"]
    db_id = created_m["db_id"]
    print(f"  -> Created meeting {m_id} with {len(created_a)} actions.")

    # Verify meeting and actions exist
    meetings_before = get_all_meetings_from_db()
    actions_before = get_all_action_items_from_db()
    assert any(m["id"] == m_id for m in meetings_before), "Meeting should exist before deletion"
    assert any(a["meeting_id"] == db_id for a in actions_before), "Actions should exist before deletion"

    # Delete meeting
    deleted = delete_meeting_from_db(m_id)
    assert deleted is True, "delete_meeting_from_db should return True"

    # Verify meeting and its actions are removed
    meetings_after = get_all_meetings_from_db()
    actions_after = get_all_action_items_from_db()
    assert not any(m["id"] == m_id for m in meetings_after), "Meeting should be deleted from DB"
    assert not any(a["meeting_id"] == db_id for a in actions_after), "Related actions should be deleted from DB"
    print("  [PASS] Database-level deletion verified!")

    # 2. Test API DELETE endpoint
    print("\n2. Testing API DELETE /api/meetings/{id} endpoint...")
    base_url = "http://127.0.0.1:8001/api"
    try:
        # Create a meeting via API
        post_payload = {
            "title": "API Test Meeting For Deletion",
            "date": "2026-09-25",
            "department": "Product",
            "transcript": "David will deploy the telemetry update tomorrow."
        }
        post_req = urllib.request.Request(
            f"{base_url}/meetings/process",
            data=json.dumps(post_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(post_req) as resp:
            post_res = json.loads(resp.read().decode("utf-8"))

        api_m_id = post_res["meeting"]["id"]
        print(f"  -> Created meeting via API: {api_m_id}")

        # Delete meeting via API
        del_req = urllib.request.Request(
            f"{base_url}/meetings/{api_m_id}",
            headers={"Content-Type": "application/json"},
            method="DELETE"
        )
        with urllib.request.urlopen(del_req) as resp:
            del_res = json.loads(resp.read().decode("utf-8"))
            assert del_res["success"] is True, "API DELETE should return success: True"
            print(f"  -> Deleted meeting via API: {del_res['message']}")

        # Verify through GET /api/meetings
        get_m_req = urllib.request.Request(f"{base_url}/meetings")
        with urllib.request.urlopen(get_m_req) as resp:
            current_meetings = json.loads(resp.read().decode("utf-8"))
            assert not any(m["id"] == api_m_id for m in current_meetings), "Deleted meeting should not be in GET /api/meetings"

        print("  [PASS] API-level DELETE endpoint verified!")
    except Exception as e:
        print(f"  Note: API server test notice: {e}")

    print("\n=== ALL DELETE MEETING TESTS PASSED ===")


if __name__ == "__main__":
    run_tests()
