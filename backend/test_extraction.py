import os
import sys
import datetime

# Ensure backend directory is in python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from main import (
    extract_action_items_from_transcript,
    extract_owner_and_action,
    parse_deadline_from_text,
    is_valid_person_name
)

def run_all_tests():
    meeting_date = "2026-09-24"

    test_cases = [
        # 1. "Manager: Lalitha will complete..." -> Owner must be Lalitha, not Manager
        ("Manager: Lalitha will complete the API integration tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager (VP Engineering): Lalitha will complete the audit by tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha, please complete the test suite tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha, can you please complete the backend service tomorrow?", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha needs to complete the database indexing tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha has to complete the database indexing tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha should complete the deployment tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha must complete the deployment tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha to deploy the package tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha is going to complete the migration tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha will handle the infrastructure setup tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha will take care of the security scan tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha agreed to complete the task tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Lalitha commits to completing the task tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: So Lalitha will complete the migration tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Let's have Lalitha complete the documentation tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Assigned to Lalitha: fix the bug by tomorrow.", "Lalitha", "2026-09-25"),
        ("Manager: Action item for Lalitha: fix the bug by tomorrow.", "Lalitha", "2026-09-25"),
        ("John: Lalitha will complete the PR review tomorrow.", "Lalitha", "2026-09-25"),

        # 2. First person commitments (Speaker is a real person)
        ("Lalitha: I will complete the backend tasks tomorrow.", "Lalitha", "2026-09-25"),
        ("Lalitha (Lead Engineer): I commit to fixing the bug by tomorrow.", "Lalitha", "2026-09-25"),
        ("Sarah Chen: I will finalize the documentation tomorrow.", "Sarah Chen", "2026-09-25"),

        # 3. Tomorrow calculation from meeting date (Meeting date = 2026-09-24 -> tomorrow = 2026-09-25)
        ("Manager: Complete the report tomorrow.", "Not specified", "2026-09-25"),
        ("Manager: We need to deploy tomorrow.", "Not specified", "2026-09-25"),
        ("Manager: Please submit the code tomorrow.", "Not specified", "2026-09-25"),

        # 4. Do not invent owners or dates -> "Not specified" if unclear
        ("Manager: Lalitha will complete the tasks.", "Lalitha", "Not specified"),
        ("Sarah Chen: I will compile the GPU budget spreadsheet.", "Sarah Chen", "Not specified"),
        ("Manager: We should update the readme.", "Not specified", "Not specified"),
        ("Manager: Someone should check the server logs.", "Not specified", "Not specified"),
        ("Host: The meeting notes need review.", "Not specified", "Not specified"),

        # 5. Full name matching
        ("Manager: Lalitha Sharma will complete the report tomorrow.", "Lalitha Sharma", "2026-09-25"),
    ]

    print("Running unit test cases...")
    all_passed = True
    for text, exp_owner, exp_deadline in test_cases:
        items = extract_action_items_from_transcript(text, meeting_date, "Test Meeting")
        item = items[0]
        actual_owner = item["owner"]
        actual_deadline = item["deadline"]
        passed = (actual_owner == exp_owner) and (actual_deadline == exp_deadline)
        status_str = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"[{status_str}] '{text}'\n       Owner: {actual_owner} (exp: {exp_owner}) | Deadline: {actual_deadline} (exp: {exp_deadline})")

    # Multi-line meeting test with current transcript
    print("\n--- Testing Current Meeting Transcript with Manager & Tomorrow ---")
    current_transcript = """[00:01:10] Manager: Good morning team. Let's review the sprint deliverables.
[00:02:30] Manager: Lalitha will complete the API integration tomorrow.
[00:04:15] Manager: We need to deploy the staging environment tomorrow.
[00:05:40] Lalitha: I will complete the security checklist by tomorrow.
[00:07:00] Manager: Lalitha will complete the documentation.
[00:08:20] Manager: We should update the readme."""

    items = extract_action_items_from_transcript(current_transcript, "2026-09-24", "Sprint Planning Meeting")
    print(f"Total extracted items: {len(items)}")
    for idx, item in enumerate(items, 1):
        print(f"  #{idx} Owner: {item['owner']:<15} | Deadline: {item['deadline']:<12} | Action: {item['action']}")

    assert items[0]["owner"] == "Lalitha"
    assert items[0]["deadline"] == "2026-09-25"

    assert items[1]["owner"] == "Not specified"
    assert items[1]["deadline"] == "2026-09-25"

    assert items[2]["owner"] == "Lalitha"
    assert items[2]["deadline"] == "2026-09-25"

    assert items[3]["owner"] == "Lalitha"
    assert items[3]["deadline"] == "Not specified"

    assert items[4]["owner"] == "Not specified"
    assert items[4]["deadline"] == "Not specified"

    # Preset Transcripts Test
    presets = [
        (
            "Q3 Enterprise Roadmap & Architecture Alignment",
            "2026-09-21",
            """[00:04:12] Sarah Chen (VP Product): Thanks everyone for joining. Let's start with the SSO multi-tenant authentication milestone. Marcus, where are we with the Okta and Azure AD integration?
[00:04:45] Marcus Vance (Lead Architect): The base SAML 2.0 protocol handler is ready, but we need to complete the SCIM directory synchronization audit before enterprise beta. I will finalize the SCIM sync documentation and PR by this Friday, September 25th.
[00:06:10] Sarah Chen: Perfect. Make sure security signs off on token caching.
[00:06:30] Elena Rostova (Staff Security Eng): Speaking of security, I reviewed the OAuth refresh flow. We noticed a potential token reuse edge case. I commit to auditing all active session revocation hooks and deploying the patch before Monday, September 28th.
[00:08:15] David Kim (Frontend Lead): Regarding the dashboard rendering speed, our bundle size grew by 18% last sprint. I will profile our bundle chunks and implement lazy route splitting by next Wednesday, September 30th.
[00:10:02] Sarah Chen: Great commitments team. Let's make sure these are logged with direct accountability."""
        ),
        (
            "SOC2 Compliance & Cloud Security Sprint",
            "2026-09-15",
            """[00:02:10] Rachel Patel (Compliance Lead): Team, auditor findings for CC6.1 access control require us to enforce hardware 2FA keys for all AWS console access.
[00:03:05] Marcus Vance: Understood. We already have 80% adoption. I will enforce the YubiKey IAM policy across all production sub-accounts by September 18th.
[00:04:40] Elena Rostova: We also have the KMS envelope encryption rotation backlog. It was carried over from last month's security review. I will finish migrating the remaining legacy unencrypted S3 buckets to KMS-CMK keys by September 24th.
[00:07:22] James Wilson (DevOps): I will run our simulated failover disaster recovery test across region us-east-2 by Friday, September 19th."""
        ),
        (
            "Customer Escalation Debrief",
            "2026-09-10",
            """[00:01:30] Alex Morgan (CS Director): Fintech Global experienced 45-second webhook dispatch delays during peak traffic on September 9th. We need immediate remediation.
[00:03:15] David Kim: The issue was Redis connection pool exhaustion under sudden webhook retry storms. I promise to deliver a resilient exponential backoff rate limiter and publish the post-mortem report by September 14th.
[00:05:40] Sarah Chen: We also promised their CTO an automated SLA uptime dashboard. Alex, will you share the live uptime portal with their executive team by September 16th?
[00:06:05] Alex Morgan: Yes, I will personally configure and send the Fintech Global dedicated dashboard link by September 16th."""
        ),
        (
            "Executive Strategy & Q4 Budget Planning",
            "2026-09-24",
            """[00:05:00] Lisa Wong (CFO): We need the revised GPU compute cloud forecasting model before board review next week.
[00:06:20] Sarah Chen: I will compile the GPU cluster utilization metrics and submit the finalized Q4 compute budget spreadsheet by Friday, October 2nd.
[00:08:10] Alex Morgan: And I will draft the enterprise customer expansion tier pricing deck by October 5th."""
        ),
        (
            "AI Pipeline & Vector DB Optimization Sync",
            "2026-09-25",
            """[00:02:15] Sarah Chen: Let's discuss our embedding latency issues in production. We are seeing vector query latencies peak above 400ms.
[00:03:00] Marcus Vance: I ran benchmarks comparing HNSW index vs IVF-PQ on pgvector. I will deliver a comprehensive vector indexing optimization benchmark by September 29th.
[00:05:20] David Kim: We also need to add client-side embedding caching for redundant queries. I will deploy client-side LRU vector caching by October 1st.
[00:07:10] Elena Rostova: I'll make sure the vector database keys are rotated and isolated under VPC endpoint policies before October 4th."""
        ),
    ]

    print("\n--- Testing All Preset Transcripts ---")
    for title, dt, transcript in presets:
        print(f"\nPreset: {title} ({dt})")
        items = extract_action_items_from_transcript(transcript, dt, title)
        for i in items:
            print(f"  -> Owner: {i['owner']:<15} | Deadline: {i['deadline']:<12} | Action: {i['action']}")

    print("\nAll Current Meeting Transcript Assertions Passed!")
    print(f"\nAll Tests Status: {'ALL PASSED' if all_passed else 'SOME FAILED'}")

if __name__ == "__main__":
    run_all_tests()
