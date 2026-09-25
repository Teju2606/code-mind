import sqlite3
import os
import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.environ.get("DB_FILE", os.path.join(os.path.dirname(__file__), "database.db"))

def get_connection():
    import database
    conn = sqlite3.connect(database.DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def check_and_update_overdue_items():
    """
    If the deadline has passed (deadline < today) and status is not COMPLETED:
    -> OVERDUE
    """
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE action_items
    SET status = 'OVERDUE'
    WHERE status != 'COMPLETED'
      AND status != 'OVERDUE'
      AND deadline != 'Not specified'
      AND deadline != ''
      AND deadline < ?
      AND deadline LIKE '____-__-__'
    """, (today_str,))
    conn.commit()
    conn.close()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create meetings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        department TEXT DEFAULT 'General',
        transcript TEXT NOT NULL,
        summary TEXT,
        attendees TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create action_items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS action_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER,
        action TEXT NOT NULL,
        owner TEXT NOT NULL,
        owner_role TEXT DEFAULT 'Assignee',
        owner_initials TEXT DEFAULT 'TM',
        owner_color TEXT DEFAULT '#2563eb',
        deadline TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NEW',
        priority TEXT DEFAULT 'MEDIUM',
        confidence TEXT DEFAULT '',
        detected_at TEXT,
        source_snippet TEXT,
        speaker TEXT,
        ai_reasoning TEXT,
        original_meeting_title TEXT,
        original_meeting_date TEXT,
        previous_meeting_title TEXT,
        previous_meeting_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    )
    """)

    # Migrate columns if existing table doesn't have them
    cursor.execute("PRAGMA table_info(action_items)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    if "original_meeting_title" not in existing_cols:
        cursor.execute("ALTER TABLE action_items ADD COLUMN original_meeting_title TEXT")
    if "original_meeting_date" not in existing_cols:
        cursor.execute("ALTER TABLE action_items ADD COLUMN original_meeting_date TEXT")
    if "previous_meeting_title" not in existing_cols:
        cursor.execute("ALTER TABLE action_items ADD COLUMN previous_meeting_title TEXT")
    if "previous_meeting_date" not in existing_cols:
        cursor.execute("ALTER TABLE action_items ADD COLUMN previous_meeting_date TEXT")

    conn.commit()
    conn.close()

    # Automatically update overdue action items if deadline has passed
    check_and_update_overdue_items()

def get_all_meetings_from_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meetings ORDER BY date DESC, id DESC")
    rows = cursor.fetchall()
    meetings = []
    for r in rows:
        meetings.append({
            "id": f"mtg-{r['id']}",
            "db_id": r["id"],
            "title": r["title"],
            "date": r["date"],
            "department": r["department"],
            "transcript": r["transcript"],
            "summary": r["summary"],
            "attendees": [a.strip() for a in r["attendees"].split(",")] if r["attendees"] else []
        })
    conn.close()
    return meetings

def get_all_action_items_from_db():
    check_and_update_overdue_items()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.*, m.title as meeting_title, m.date as meeting_date
    FROM action_items a
    LEFT JOIN meetings m ON a.meeting_id = m.id
    ORDER BY a.id DESC
    """)
    rows = cursor.fetchall()
    items = []
    for r in rows:
        keys = r.keys()
        orig_title = r["original_meeting_title"] if "original_meeting_title" in keys and r["original_meeting_title"] else (r["meeting_title"] or "General Meeting")
        orig_date = r["original_meeting_date"] if "original_meeting_date" in keys and r["original_meeting_date"] else (r["meeting_date"] or "")
        prev_title = r["previous_meeting_title"] if "previous_meeting_title" in keys and r["previous_meeting_title"] else ""
        prev_date = r["previous_meeting_date"] if "previous_meeting_date" in keys and r["previous_meeting_date"] else ""

        # If carried over and previous meeting is not set, fallback to original meeting
        if r["status"] in ("CARRIED_OVER", "CARRIED OVER") and not prev_title:
            prev_title = orig_title
            prev_date = orig_date

        items.append({
            "id": f"act-{r['id']}",
            "db_id": r["id"],
            "meeting_id": r["meeting_id"],
            "meetingId": f"mtg-{r['meeting_id']}",
            "meetingTitle": orig_title,
            "meetingDate": orig_date,
            "originalMeeting": orig_title,
            "originalMeetingTitle": orig_title,
            "originalMeetingDate": orig_date,
            "previousMeeting": prev_title,
            "previousMeetingTitle": prev_title,
            "previousMeetingDate": prev_date,
            "action": r["action"],
            "owner": r["owner"],
            "ownerRole": r["owner_role"],
            "ownerInitials": r["owner_initials"],
            "ownerColor": r["owner_color"],
            "deadline": r["deadline"],
            "status": r["status"],
            "priority": r["priority"],
            "detectedAt": r["detected_at"],
            "sourceSnippet": r["source_snippet"],
            "speaker": r["speaker"],
            "aiReasoning": r["ai_reasoning"]
        })
    conn.close()
    return items

def insert_meeting_and_actions(meeting_dict: dict, actions_list: list):
    conn = get_connection()
    cursor = conn.cursor()

    attendees_str = ", ".join(meeting_dict.get("attendees", []))
    cursor.execute("""
    INSERT INTO meetings (title, date, department, transcript, summary, attendees)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        meeting_dict["title"],
        meeting_dict["date"],
        meeting_dict.get("department", "General"),
        meeting_dict["transcript"],
        meeting_dict.get("summary", f"Processed {len(actions_list)} action items."),
        attendees_str
    ))

    meeting_id = cursor.lastrowid
    created_actions = []
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    for item in actions_list:
        # For CARRIED_OVER items, keep the original meeting ID if provided
        action_meeting_id = item.get("meeting_id") if item.get("status") in ("CARRIED_OVER", "CARRIED OVER") and item.get("meeting_id") else meeting_id
        
        status_val = item.get("status", "NEW")
        deadline_val = item.get("deadline", "Not specified")

        # If deadline has passed and status is not COMPLETED: -> OVERDUE
        if status_val != "COMPLETED" and deadline_val != "Not specified" and len(deadline_val) == 10 and deadline_val < today_str:
            status_val = "OVERDUE"
            item["status"] = "OVERDUE"

        orig_title = item.get("originalMeeting") or item.get("originalMeetingTitle") or (item.get("meetingTitle") if item.get("status") in ("CARRIED_OVER", "CARRIED OVER") and item.get("meetingTitle") else meeting_dict["title"])
        orig_date = item.get("originalMeetingDate") or (item.get("meetingDate") if item.get("status") in ("CARRIED_OVER", "CARRIED OVER") and item.get("meetingDate") else meeting_dict["date"])
        prev_title = item.get("previousMeeting") or item.get("previousMeetingTitle") or (orig_title if item.get("status") in ("CARRIED_OVER", "CARRIED OVER") else "")
        prev_date = item.get("previousMeetingDate") or (orig_date if item.get("status") in ("CARRIED_OVER", "CARRIED OVER") else "")

        cursor.execute("""
        INSERT INTO action_items (
            meeting_id, action, owner, owner_role, owner_initials, owner_color,
            deadline, status, priority, confidence, detected_at, source_snippet,
            speaker, ai_reasoning,
            original_meeting_title, original_meeting_date,
            previous_meeting_title, previous_meeting_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            action_meeting_id,
            item["action"],
            item["owner"],
            item.get("ownerRole", "Assignee"),
            item.get("ownerInitials", "TM"),
            item.get("ownerColor", "#2563eb"),
            deadline_val,
            status_val,
            item.get("priority", "MEDIUM"),
            "",
            item.get("detectedAt", ""),
            item.get("sourceSnippet", ""),
            item.get("speaker", item["owner"]),
            item.get("aiReasoning", f"Action commitment for {item['owner']}."),
            orig_title,
            orig_date,
            prev_title,
            prev_date
        ))
        action_id = cursor.lastrowid

        created_actions.append({
            "id": f"act-{action_id}",
            "db_id": action_id,
            "meeting_id": action_meeting_id,
            "meetingId": f"mtg-{action_meeting_id}",
            "meetingTitle": orig_title,
            "meetingDate": orig_date,
            "originalMeeting": orig_title,
            "originalMeetingTitle": orig_title,
            "originalMeetingDate": orig_date,
            "previousMeeting": prev_title,
            "previousMeetingTitle": prev_title,
            "previousMeetingDate": prev_date,
            **item
        })

    conn.commit()
    conn.close()

    created_meeting = {
        "id": f"mtg-{meeting_id}",
        "db_id": meeting_id,
        "title": meeting_dict["title"],
        "date": meeting_dict["date"],
        "department": meeting_dict.get("department", "General"),
        "transcript": meeting_dict["transcript"],
        "summary": meeting_dict.get("summary", f"Processed {len(actions_list)} action items."),
        "attendees": meeting_dict.get("attendees", [])
    }

    return created_meeting, created_actions

def update_status_in_db(action_id: str, new_status: str):
    # Parse id (supports "act-123" or 123)
    clean_id = int(str(action_id).replace("act-", "").replace("act-gen-", "").split("-")[-1])
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE action_items SET status = ? WHERE id = ?", (new_status, clean_id))
    conn.commit()
    conn.close()
    return True

def delete_meeting_from_db(meeting_id: str):
    # Parse id (supports "mtg-123", "123", or int)
    clean_id = int(str(meeting_id).replace("mtg-", "").split("-")[-1])
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    # Delete related action items first
    cursor.execute("DELETE FROM action_items WHERE meeting_id = ?", (clean_id,))
    # Delete meeting
    cursor.execute("DELETE FROM meetings WHERE id = ?", (clean_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

