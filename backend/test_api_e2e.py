import urllib.request
import json

def test_api():
    base_url = "http://127.0.0.1:8001/api"

    print("=================================================================")
    print("RUNNING E2E API TESTS FOR CARRIED_OVER TRACKING (2 MEETINGS)")
    print("=================================================================")

    # 1. Post Meeting 1 (Sprint 101)
    payload_1 = {
        "title": "Sprint 101 Architecture Sync",
        "date": "2026-09-20",
        "department": "Engineering",
        "transcript": """Manager: Lalitha will complete the backend API integration tomorrow.
David Kim: I will deploy the redis cluster tomorrow."""
    }

    req1 = urllib.request.Request(
        f"{base_url}/meetings/process",
        data=json.dumps(payload_1).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req1) as resp:
        res1 = json.loads(resp.read().decode("utf-8"))

    print(f"\n[Meeting 1 Created]: {res1['meeting']['title']} (ID: {res1['meeting']['id']})")
    items_m1 = res1["actionItems"]
    lalitha_m1 = next(item for item in items_m1 if item["owner"] == "Lalitha")
    print(f"  -> Action: '{lalitha_m1['action']}' | Owner: {lalitha_m1['owner']} | Status: {lalitha_m1['status']} | Meeting: {lalitha_m1['meetingTitle']}")
    assert lalitha_m1["status"] in ("NEW", "CARRIED_OVER", "OVERDUE")
    m1_action_id = lalitha_m1["id"]
    m1_title = lalitha_m1["meetingTitle"]

    # 2. Post Meeting 2 (Sprint 102) with SAME action for Lalitha (previous not completed)
    payload_2 = {
        "title": "Sprint 102 Architecture Sync",
        "date": "2026-09-27",
        "department": "Engineering",
        "transcript": """Manager: Lalitha will complete the backend API integration tomorrow."""
    }

    req2 = urllib.request.Request(
        f"{base_url}/meetings/process",
        data=json.dumps(payload_2).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req2) as resp:
        res2 = json.loads(resp.read().decode("utf-8"))

    print(f"\n[Meeting 2 Created]: {res2['meeting']['title']} (ID: {res2['meeting']['id']})")
    items_m2 = res2["actionItems"]
    lalitha_m2 = next(item for item in items_m2 if item["owner"] == "Lalitha")
    print(f"  -> Action: '{lalitha_m2['action']}' | Owner: {lalitha_m2['owner']} | Status: {lalitha_m2['status']} | Meeting: {lalitha_m2['meetingTitle']}")
    
    # Assertions for Meeting 2:
    # - Marked as CARRIED_OVER
    # - Keeps original meeting title and source
    assert lalitha_m2["status"] == "CARRIED_OVER", f"Expected CARRIED_OVER, got {lalitha_m2['status']}"
    assert lalitha_m2["meetingTitle"] == m1_title, f"Expected {m1_title}, got {lalitha_m2['meetingTitle']}"
    assert "backend API integration" in lalitha_m2["sourceSnippet"]
    print("--> Assertion 1 PASSED: Uncompleted action marked as CARRIED_OVER with original meeting preserved.")

    # 3. Mark previous actions as COMPLETED
    patch_payload = {"status": "COMPLETED"}
    req_patch = urllib.request.Request(
        f"{base_url}/action-items/{m1_action_id}/status",
        data=json.dumps(patch_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    with urllib.request.urlopen(req_patch) as resp:
        patch_res = json.loads(resp.read().decode("utf-8"))
        assert patch_res["success"] is True

    req_patch2 = urllib.request.Request(
        f"{base_url}/action-items/{lalitha_m2['id']}/status",
        data=json.dumps(patch_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    with urllib.request.urlopen(req_patch2) as resp:
        patch_res2 = json.loads(resp.read().decode("utf-8"))
        assert patch_res2["success"] is True

    # 4. Post Meeting 3 (Sprint 103) with SAME action after completion
    payload_3 = {
        "title": "Sprint 103 Architecture Sync",
        "date": "2026-10-04",
        "department": "Engineering",
        "transcript": """Lalitha: I will complete the backend API integration tomorrow."""
    }

    req3 = urllib.request.Request(
        f"{base_url}/meetings/process",
        data=json.dumps(payload_3).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req3) as resp:
        res3 = json.loads(resp.read().decode("utf-8"))

    print(f"\n[Meeting 3 Created after COMPLETED status]: {res3['meeting']['title']} (ID: {res3['meeting']['id']})")
    items_m3 = res3["actionItems"]
    lalitha_m3 = next(item for item in items_m3 if item["owner"] == "Lalitha")
    print(f"  -> Action: '{lalitha_m3['action']}' | Owner: {lalitha_m3['owner']} | Status: {lalitha_m3['status']} | Meeting: {lalitha_m3['meetingTitle']}")

    # Assertion for Meeting 3:
    # - Treated as NEW when previous is COMPLETED
    assert lalitha_m3["status"] == "NEW", f"Expected NEW, got {lalitha_m3['status']}"
    assert lalitha_m3["meetingTitle"] == "Sprint 103 Architecture Sync"
    print("--> Assertion 2 PASSED: If previous action is COMPLETED, treated as NEW.")

    print("\n=================================================================")
    print("ALL END-TO-END API ASSERTIONS PASSED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    test_api()
