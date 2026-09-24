import urllib.request
import urllib.parse
import json
import datetime

def run_tests():
    base_url = "http://127.0.0.1:8001/api"
    print("=" * 60)
    print("E2E TESTING ALL 4 STATUSES & AUTO-OVERDUE UPDATES")
    print("=" * 60)

    # 1. Test Health
    req_health = urllib.request.Request(f"{base_url}/health")
    with urllib.request.urlopen(req_health) as resp:
        health = json.loads(resp.read().decode("utf-8"))
        print(f"[1] Backend Health: {health}")
        assert health["status"] == "ok"

    # 2. Test Fetching Action Items & Dashboard Stats
    req_items = urllib.request.Request(f"{base_url}/action-items")
    with urllib.request.urlopen(req_items) as resp:
        items = json.loads(resp.read().decode("utf-8"))
        print(f"[2] Fetched {len(items)} action items from SQLite.")

    req_stats = urllib.request.Request(f"{base_url}/dashboard/stats")
    with urllib.request.urlopen(req_stats) as resp:
        stats = json.loads(resp.read().decode("utf-8"))
        print(f"[3] Initial Dashboard Stats: {stats}")

    # Check that overdue items whose deadlines passed and are not COMPLETED are marked OVERDUE
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    for item in items:
        if item["status"] != "COMPLETED" and item["deadline"] != "Not specified" and item["deadline"] < today_str:
            assert item["status"] == "OVERDUE", f"Expected OVERDUE for past deadline {item['deadline']}, got {item['status']}"
    print("[4] Verified: All non-completed items with past deadlines are OVERDUE in SQLite.")

    # 3. Create a test meeting with items in various states
    future_date = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
    past_date = (datetime.date.today() - datetime.timedelta(days=3)).strftime("%Y-%m-%d")

    payload_meeting = {
        "title": "E2E Status Testing Sprint",
        "date": today_str,
        "department": "Engineering",
        "transcript": f"""Sarah Chen: I will complete the new authorization module by {future_date}.
Marcus Vance: I will deploy the security patch by {past_date}."""
    }

    req_proc = urllib.request.Request(
        f"{base_url}/meetings/process",
        data=json.dumps(payload_meeting).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req_proc) as resp:
        res_proc = json.loads(resp.read().decode("utf-8"))

    created_actions = res_proc["actionItems"]
    print(f"\n[5] Created {len(created_actions)} items from new transcript:")
    for a in created_actions:
        print(f"    - ID: {a['id']}, Action: '{a['action']}', Deadline: {a['deadline']}, Status: {a['status']}")

    sarah_item = next(a for a in created_actions if "Sarah" in a["owner"])
    marcus_item = next(a for a in created_actions if "Marcus" in a["owner"])

    # Sarah has future deadline -> status NEW
    assert sarah_item["status"] == "NEW", f"Expected NEW, got {sarah_item['status']}"
    # Marcus has past deadline -> status OVERDUE
    assert marcus_item["status"] == "OVERDUE", f"Expected OVERDUE for past deadline, got {marcus_item['status']}"
    print("[6] Verified: Future deadline is NEW; Past deadline automatically became OVERDUE.")

    # 4. Test updating status to each of the 4 statuses:
    statuses_to_test = ["CARRIED_OVER", "OVERDUE", "NEW", "COMPLETED"]
    test_item_id = sarah_item["id"]

    for st in statuses_to_test:
        patch_req = urllib.request.Request(
            f"{base_url}/action-items/{test_item_id}/status",
            data=json.dumps({"status": st}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="PATCH"
        )
        with urllib.request.urlopen(patch_req) as resp:
            patch_res = json.loads(resp.read().decode("utf-8"))
            assert patch_res["success"] is True
            assert patch_res["status"] == st

        # Verify from GET /api/action-items
        req_verify = urllib.request.Request(f"{base_url}/action-items")
        with urllib.request.urlopen(req_verify) as resp:
            all_items_now = json.loads(resp.read().decode("utf-8"))
            current_item = next(i for i in all_items_now if i["id"] == test_item_id)
            assert current_item["status"] == st, f"Expected {st} in SQLite, got {current_item['status']}"
            print(f"    [Status Update Verified in SQLite]: {st}")

    # 5. Verify Dashboard stats updated automatically
    req_stats_final = urllib.request.Request(f"{base_url}/dashboard/stats")
    with urllib.request.urlopen(req_stats_final) as resp:
        stats_final = json.loads(resp.read().decode("utf-8"))
        print(f"\n[7] Updated Dashboard Stats from SQLite: {stats_final}")
        assert stats_final["totalActionItems"] > stats["totalActionItems"]

    print("\n" + "=" * 60)
    print("ALL E2E STATUS & DATABASE TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
