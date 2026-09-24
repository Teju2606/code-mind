import os
import sys
import re
import datetime
from contextlib import asynccontextmanager
from typing import Optional, List, Tuple, Dict, Any

# Ensure current directory is on python path for imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from database import (
    init_db,
    get_all_meetings_from_db,
    get_all_action_items_from_db,
    insert_meeting_and_actions,
    update_status_in_db
)

# Lifespan context manager for database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

# Initialize FastAPI application
app = FastAPI(
    title="AI Meeting-to-Accountability Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class ProcessMeetingRequest(BaseModel):
    title: str
    date: str
    transcript: str
    department: Optional[str] = "General"

class UpdateStatusRequest(BaseModel):
    status: str

# ----------------- EXTRACTION LOGIC -----------------

NON_NAME_WORDS = {
    # Pronouns & determiners
    "we", "they", "everyone", "everybody", "someone", "somebody", "nobody", "noone", "no one",
    "anyone", "anybody", "it", "this", "that", "these", "those", "there", "here",
    "you", "the", "our", "my", "your", "their", "his", "her", "its", "all", "both",
    "each", "either", "neither", "none", "one", "some", "few", "many", "several",
    "what", "which", "who", "whom", "whose", "where", "when", "why", "how",

    # Generic titles, roles & speaker tags
    "manager", "host", "admin", "moderator", "speaker", "facilitator", "organizer",
    "system", "server", "client", "bot", "assistant", "ai", "lead", "director",
    "engineer", "developer", "architect", "team", "folks", "guys", "people", "members",
    "unassigned", "transcript", "note", "notes", "recorder", "user", "attendee",

    # Common discourse markers & adverbs
    "yes", "no", "thanks", "thank", "ok", "okay", "sure", "great", "please", "also",
    "next", "let", "lets", "let's", "so", "well", "then", "now", "just", "actually",
    "basically", "essentially", "meanwhile", "furthermore", "moreover", "additionally",
    "however", "first", "firstly", "second", "secondly", "third", "finally", "lastly",
    "overall", "similarly", "definitely", "certainly", "probably", "possibly",
    "maybe", "perhaps", "regarding", "speaking", "under", "across", "before", "after",
    "during", "since", "until", "anyway", "anyways", "regardless", "instead", "otherwise",
    "currently", "already", "soon", "later", "again", "together",

    # Verbs / Modals
    "can", "could", "would", "should", "must", "will", "shall", "to", "as", "by",
    "for", "in", "on", "at", "if", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "going", "need", "needs", "agreed",
    "responsible", "handle", "and", "or", "but", "with", "about", "into", "through",

    # Tech & Domain terms
    "backend", "frontend", "api", "service", "project", "sprint", "issue", "bug",
    "task", "ticket", "feature", "build", "release", "deploy", "deployment",
    "documentation", "pr", "security", "audit", "database", "sql", "sqlite",
    "aws", "cloud", "server", "cluster", "model", "pipeline", "platform",

    # Days & Months
    "today", "tomorrow", "yesterday", "tonight", "eod",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december", "jan", "feb", "mar", "apr",
    "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",

    # Action / Status keywords
    "assigned", "action", "item", "deliverable", "milestone", "status", "update",
    "review", "report", "meeting", "roadmap", "plan", "summary"
}

GENERIC_ROLES = {
    "manager", "host", "moderator", "speaker", "admin", "facilitator",
    "organizer", "unassigned", "transcript note", "note", "all", "team",
    "speaker 1", "speaker 2", "speaker 3", "speaker 4"
}

def clean_speaker_name(speaker: Optional[str]) -> Optional[str]:
    """Cleans role annotations like 'Sarah Chen (VP Product)' -> 'Sarah Chen'."""
    if not speaker:
        return None
    s = re.sub(r"\s*\([^)]*\)", "", speaker).strip()
    s = re.sub(r"\s*\[[^\]]*\]", "", s).strip()
    s = re.sub(r"\s*-\s*[A-Za-z\s]+$", "", s).strip()
    s = s.strip(" :,-")
    return s if s else None

def is_valid_person_name(name: str) -> bool:
    """Checks if a string is a plausible person's name."""
    if not name:
        return False
    name_clean = name.strip(" ,.:;-–—()[]\"'")
    if not name_clean:
        return False
    parts = name_clean.split()
    if not parts or len(parts) > 3:
        return False
    for p in parts:
        p_clean = re.sub(r"[^a-zA-Z]", "", p)
        if not p_clean or len(p_clean) < 2:
            return False
        if p_clean.lower() in NON_NAME_WORDS:
            return False
        if not p[0].isupper():
            return False
    return True

def parse_meeting_date(meeting_date_str: str) -> datetime.datetime:
    """Safely parse meeting date into datetime object."""
    if not meeting_date_str:
        return datetime.datetime.now()
    formats = [
        "%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y",
        "%B %d, %Y", "%b %d, %Y", "%Y-%m-%dT%H:%M:%S"
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(meeting_date_str.strip(), fmt)
        except Exception:
            continue
    try:
        dt_date = datetime.date.fromisoformat(meeting_date_str.strip())
        return datetime.datetime(dt_date.year, dt_date.month, dt_date.day)
    except Exception:
        return datetime.datetime.now()

def parse_deadline_from_text(text: str, meeting_date_str: str) -> str:
    """
    Extracts deadline from text.
    1. 'day after tomorrow' -> meeting_date + 2 days
    2. 'tomorrow' -> calculate from meeting_date (e.g. 2026-09-24 -> 2026-09-25)
    3. 'today' / 'eod' -> meeting_date
    4. Specific dates (ISO, Month Day, Weekday with deadline keywords)
    5. If deadline is not clear -> 'Not specified'
    """
    meeting_dt = parse_meeting_date(meeting_date_str)
    lower = text.lower()

    # 1. 'day after tomorrow' (Must check before 'tomorrow')
    if "day after tomorrow" in lower:
        return (meeting_dt + datetime.timedelta(days=2)).strftime("%Y-%m-%d")

    # 2. 'tomorrow' / 'by tomorrow' -> calculate exactly from meeting_date
    if re.search(r"\btomorrow\b", lower):
        return (meeting_dt + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    # 3. 'today' / 'by eod' / 'end of day' / 'by tonight'
    if re.search(r"\b(?:by\s+)?(?:today|eod|end of day|tonight)\b", lower):
        return meeting_dt.strftime("%Y-%m-%d")

    # 4. 'in X days'
    in_days_match = re.search(r"\bin\s+(\d+)\s+days?\b", lower)
    if in_days_match:
        days = int(in_days_match.group(1))
        return (meeting_dt + datetime.timedelta(days=days)).strftime("%Y-%m-%d")

    # 5. Explicit ISO date: YYYY-MM-DD
    iso_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
    if iso_match:
        return iso_match.group(1)

    # 6. Specific Month and Day: e.g. 'September 25th', 'Sept 25', '25th September', 'October 2nd'
    month_names = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "june": 6, "jul": 7, "july": 7,
        "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
        "oct": 10, "october": 10, "nov": 11, "november": 11, "december": 12, "dec": 12, "jun": 6
    }
    month_regex_1 = r"\b(?:by|before|due|on)?\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b"
    m_match = re.search(month_regex_1, lower)
    if m_match:
        m_name = m_match.group(1)
        day = int(m_match.group(2))
        month_num = month_names.get(m_name)
        if month_num:
            year = meeting_dt.year
            try:
                target_dt = datetime.datetime(year, month_num, day)
                return target_dt.strftime("%Y-%m-%d")
            except ValueError:
                pass

    # Reverse format: '25th of September', '25 September'
    month_regex_2 = r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\b"
    m_match2 = re.search(month_regex_2, lower)
    if m_match2:
        day = int(m_match2.group(1))
        m_name = m_match2.group(2)
        month_num = month_names.get(m_name)
        if month_num:
            year = meeting_dt.year
            try:
                target_dt = datetime.datetime(year, month_num, day)
                return target_dt.strftime("%Y-%m-%d")
            except ValueError:
                pass

    # 7. Weekdays with explicit future/deadline markers:
    # e.g. 'by Friday', 'this Friday', 'next Wednesday', 'before Monday', 'due Friday'
    weekdays = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    for day_name, target_weekday in weekdays.items():
        weekday_pattern = rf"\b(?:by\s+|before\s+|due\s+(?:on\s+)?|due\s+|this\s+|next\s+){day_name}\b"
        if re.search(weekday_pattern, lower):
            current_weekday = meeting_dt.weekday()
            days_ahead = (target_weekday - current_weekday) % 7
            if days_ahead == 0:
                days_ahead = 7 if "next" in lower else 0
            return (meeting_dt + datetime.timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    # If deadline is not clear, do NOT invent dates
    return "Not specified"

def clean_action_text(text: str) -> str:
    """Cleans prefixes, quotes, and punctuation from action item text."""
    clean = re.sub(r"^[-*•0-9.)\s]+", "", text).strip()
    clean = re.sub(
        r"^(?:(?:yes|so|and|also|sure|ok|okay|well|then)(?:,\s*|\s+))?(?:i will also|i will personally|i will|i commit to|i promise to|i'll make sure to|i'll make sure|i'll|can you please|could you please|will you please|can you|could you|will you|you should|you will|you need to|please|we should|we need to|i shall|i am going to|i'm going to|i can take|i can|assigned to|action item for|action for|to)\s+",
        "",
        clean,
        flags=re.IGNORECASE
    )
    clean = clean.strip(' "\'')
    if not clean:
        clean = text.strip(' "\'')
    if not clean:
        return "Action item"
    return clean[0].upper() + clean[1:]

def extract_owner_and_action(speaker: Optional[str], utterance: str) -> Tuple[str, str]:
    """
    Extracts the true owner and cleaned action text.
    1. If transcript says: 'Manager: Lalitha will complete...' -> Owner is Lalitha, NOT Manager.
    2. If first person commitment: 'Lalitha: I will complete...' -> Owner is Lalitha.
    3. If owner is not clear -> 'Not specified'.
    """
    utterance_clean = utterance.strip()
    cleaned_speaker = clean_speaker_name(speaker)

    # 1. Check for explicit assignment pattern:
    # e.g. "Assigned to Lalitha: complete...", "Action for Lalitha - complete..."
    assigned_pattern = re.search(
        r"(?i:assigned to|action item for|action for|assign to|assigned for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s*[:\-to,]?\s*(.+)",
        utterance_clean
    )
    if assigned_pattern:
        cand = assigned_pattern.group(1).strip()
        if is_valid_person_name(cand):
            action_raw = assigned_pattern.group(2).strip()
            return cand, clean_action_text(action_raw)

    # 2. Check for delegation pattern:
    # e.g. "Let's have Lalitha complete...", "We'll have Lalitha complete...", "Ask Lalitha to complete..."
    delegation_pattern = re.search(
        r"(?i:let['’]?s\s+have|let\s+us\s+have|we\s+will\s+have|we['’]ll\s+have|have|ask)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:to\s+)?(.+)",
        utterance_clean
    )
    if delegation_pattern:
        cand = delegation_pattern.group(1).strip()
        if is_valid_person_name(cand):
            action_raw = delegation_pattern.group(2).strip()
            return cand, clean_action_text(action_raw)

    # 3. Check for directly addressed assignment / imperative:
    # e.g. "Lalitha, please complete...", "Lalitha, can you deploy...", "Lalitha - complete...", "Lalitha: complete..."
    addressed_pattern = re.search(
        r"(?:^|[\.\?!]\s*)(?:[A-Za-z\s]+,\s*)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s*[:,\-]\s*(?i:please\s+|can you\s+|could you\s+|will you\s+|you will\s+|you should\s+|you need to\s+)?(.+)",
        utterance_clean
    )
    if addressed_pattern:
        cand = addressed_pattern.group(1).strip()
        if is_valid_person_name(cand):
            action_raw = addressed_pattern.group(2).strip()
            return cand, clean_action_text(action_raw)

    # 4. Check for third-person statement / assignment:
    # Find names followed by action modal verbs: "Lalitha will complete...", "So Lalitha will complete..."
    modal_verbs_regex = r"(?i:will\s+be\s+responsible\s+for|will\s+take\s+care\s+of|will\s+handle|is\s+assigned\s+to|is\s+responsible\s+for|is\s+going\s+to|are\s+going\s+to|needs\s+to|need\s+to|has\s+to|have\s+to|agreed\s+to|agrees\s+to|promises\s+to|promised\s+to|committed\s+to|commits\s+to|is\s+to|will\s+be|will|shall|must|should|can|to)"

    # Try 2-word name first
    third_person_2 = re.search(rf"\b([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)\s+{modal_verbs_regex}\s+(.+)", utterance_clean)
    if third_person_2:
        cand = third_person_2.group(1).strip()
        if is_valid_person_name(cand):
            action_raw = third_person_2.group(2).strip()
            return cand, clean_action_text(action_raw)

    # Try 1-word name
    third_person_1 = re.search(rf"\b([A-Z][a-zA-Z]+)\s+{modal_verbs_regex}\s+(.+)", utterance_clean)
    if third_person_1:
        cand = third_person_1.group(1).strip()
        if is_valid_person_name(cand):
            action_raw = third_person_1.group(2).strip()
            return cand, clean_action_text(action_raw)

    # 5. Check for first-person commitment anywhere in utterance:
    # e.g. "I will complete...", "And I will draft...", "I commit to...", "I'll...", "I am going to...", "I promise to..."
    first_person_pattern = re.search(
        r"(?:^|[\.\?!;]\s*)(?:(?i:yes|so|and|also|sure|ok|okay|well|then)(?:,\s*|\s+))?(?i:i will also|i will personally|i will|i commit to|i promise to|i'll make sure to|i'll make sure|i'll|i shall|i am going to|i'm going to|i can take|i can do|i will handle|i will take care of|i will finish)\s+(.+)",
        utterance_clean
    )
    if first_person_pattern:
        action_raw = first_person_pattern.group(1).strip()
        if cleaned_speaker and cleaned_speaker.lower() not in GENERIC_ROLES and is_valid_person_name(cleaned_speaker):
            return cleaned_speaker, clean_action_text(action_raw)
        else:
            return "Not specified", clean_action_text(action_raw)

    # 6. If no person name is clear, return 'Not specified'
    return "Not specified", clean_action_text(utterance_clean)

def is_actionable_line(utterance: str) -> bool:
    """Determines if an utterance contains an actual task commitment, assignment, or action item."""
    lower = utterance.strip().lower()

    # Skip purely conversational chit-chat / greetings / closings with no task
    if re.search(r"^(?:thanks everyone|great meeting|meeting adjourned|talk to you all|great commitments team|hello everyone|good morning|good afternoon|hi everyone)\b", lower):
        if not ("i will" in lower or "i commit" in lower or "assigned to" in lower or "will complete" in lower):
            return False

    # Skip pure status questions like "where are we with...", "how is...", "what is the status of..."
    if re.search(r"^(?:where are we with|how is|what is the status of|any updates on)\b", lower):
        return False

    # Action verbs and modal commitment triggers
    triggers = [
        "i will", "i'll", "i commit", "i promise", "i shall", "i am going to", "i'm going to",
        "will complete", "will deploy", "will audit", "will finalize", "will deliver", "will fix",
        "will submit", "will configure", "will reconfigure", "will draft", "will enforce",
        "will profile", "will implement", "will run", "will test", "will verify", "will handle",
        "will take care", "will update", "will send", "will lead", "will manage", "will create",
        "will prepare", "will execute", "will finish", "will migrate",
        "assigned to", "action item for", "action for", "assign to",
        "needs to", "need to", "has to", "have to", "agreed to", "promises to", "commits to",
        "please complete", "please deploy", "please fix", "please submit", "please update",
        "please review", "please send", "please audit", "we need to", "we should",
        "tomorrow", "today", "eod", "due by", "due on", "by friday", "by monday",
        "by tuesday", "by wednesday", "by thursday"
    ]
    if any(t in lower for t in triggers):
        return True

    # Check for [Name] will / [Name] to / [Name] should / [Name] must
    if re.search(r"\b[A-Z][a-zA-Z]+\s+(?:will|shall|must|should|can|to)\s+", utterance):
        return True

    return False

def extract_action_items_from_transcript(transcript: str, meeting_date: str, meeting_title: str) -> List[Dict[str, Any]]:
    """
    Extracts action items from meeting transcript adhering strictly to:
    1. Third-person owner override (e.g. 'Manager: Lalitha will...' -> Owner: Lalitha)
    2. 'tomorrow' calculation from meeting_date
    3. 'Not specified' if owner or deadline is not clear
    """
    lines = [line.strip() for line in transcript.split("\n") if line.strip()]
    extracted = []
    colors = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#ea580c", "#0891b2"]

    for idx, line in enumerate(lines):
        # Extract speaker and utterance
        speaker_match = re.search(r"(?:\[\d{2}:\d{2}(?::\d{2})?\]\s*)?([A-Za-z0-9\s._-]+?)(?:\s*\([^)]+\))?:\s*(.+)", line)

        speaker_tag = None
        utterance = line

        if speaker_match:
            speaker_tag = speaker_match.group(1).strip()
            utterance = speaker_match.group(2).strip()

        # If transcript is a few lines or contains actionable commitment
        if is_actionable_line(utterance) or len(lines) <= 2:
            owner, action_text = extract_owner_and_action(speaker_tag, utterance)
            deadline = parse_deadline_from_text(utterance, meeting_date)

            # Initials and color
            if owner == "Not specified":
                initials = "NS"
                owner_color = "#64748b"
                owner_role = "Unassigned"
            else:
                initials = "".join([n[0] for n in owner.split() if n])[:2].upper() or "TM"
                owner_color = colors[len(extracted) % len(colors)]
                owner_role = "Assignee"

            extracted.append({
                "action": action_text,
                "owner": owner,
                "ownerRole": owner_role,
                "ownerInitials": initials,
                "ownerColor": owner_color,
                "deadline": deadline,
                "status": "NEW",
                "priority": "HIGH" if len(extracted) == 0 else "MEDIUM",
                "detectedAt": f"{meeting_date} {datetime.datetime.now().strftime('%H:%M:%S')}",
                "sourceSnippet": line,
                "speaker": speaker_tag or "Transcript Note",
                "aiReasoning": f"Extracted commitment for {owner} (Deadline: {deadline})."
            })

    # Default fallback if nothing was extracted
    if not extracted:
        extracted.append({
            "action": f"Action items from {meeting_title}",
            "owner": "Not specified",
            "ownerRole": "Unassigned",
            "ownerInitials": "NS",
            "ownerColor": "#64748b",
            "deadline": "Not specified",
            "status": "NEW",
            "priority": "MEDIUM",
            "detectedAt": f"{meeting_date} {datetime.datetime.now().strftime('%H:%M:%S')}",
            "sourceSnippet": transcript[:140] + "...",
            "speaker": "Transcript Note",
            "aiReasoning": f"Action items extracted from {meeting_title}."
        })

    return extracted

def normalize_action_for_matching(text: str) -> str:
    """Normalizes action text for finding duplicate / carried-over tasks."""
    s = text.lower().strip()
    s = re.sub(r"\b(?:tomorrow|today|yesterday|eod|tonight|by\s+tomorrow|by\s+today|by\s+eod|by\s+tonight)\b", "", s)
    s = re.sub(r"\b\d{4}-\d{2}-\d{2}\b", "", s)
    s = re.sub(r"\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\b", "", s)
    s = re.sub(r"\b(?:by|before|due|on|this|next)?\s*(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", "", s)
    s = re.sub(r"[^\w\s]", "", s)
    return " ".join(s.split())

def find_matching_previous_action(action_text: str, owner: str, existing_items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Finds the most recent matching previous action item from earlier meetings.
    """
    norm_target = normalize_action_for_matching(action_text)
    if not norm_target or len(norm_target) < 3:
        return None

    target_tokens = set(norm_target.split())
    stop_words = {"the", "a", "an", "and", "or", "to", "for", "in", "on", "at", "by", "with", "from", "of", "all", "our", "my", "your", "is", "are", "be"}
    target_key_tokens = target_tokens - stop_words

    # existing_items are ordered by id DESC
    for existing in existing_items:
        existing_action = existing.get("action", "")
        existing_owner = existing.get("owner", "Not specified")
        
        # Check owner compatibility (if both are specified, they should match)
        if owner != "Not specified" and existing_owner != "Not specified":
            if owner.strip().lower() != existing_owner.strip().lower():
                continue

        norm_existing = normalize_action_for_matching(existing_action)
        if not norm_existing:
            continue

        # 1. Exact normalized match
        if norm_target == norm_existing:
            return existing

        # 2. Substring containment match for sufficiently long phrases
        if (norm_target in norm_existing or norm_existing in norm_target) and min(len(norm_target), len(norm_existing)) >= 8:
            return existing

        # 3. High keyword overlap match
        existing_tokens = set(norm_existing.split())
        existing_key_tokens = existing_tokens - stop_words
        if len(target_key_tokens) >= 2 and len(existing_key_tokens) >= 2:
            intersection = target_key_tokens.intersection(existing_key_tokens)
            smaller_len = min(len(target_key_tokens), len(existing_key_tokens))
            if len(intersection) / smaller_len >= 0.8:
                return existing

    return None

def apply_carried_over_tracking(action_items: List[Dict[str, Any]], existing_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Carried-over tracking rules:
    - If the same action appears in a new meeting and the previous action is NOT COMPLETED:
      1. Mark the new action as CARRIED_OVER.
      2. Keep the original meeting/source.
      3. Show the status as CARRIED_OVER.
    - If the previous action is COMPLETED, treat the new action as NEW.
    """
    for item in action_items:
        match = find_matching_previous_action(item["action"], item["owner"], existing_items)
        if match:
            prev_status = match.get("status", "NEW")
            if prev_status != "COMPLETED":
                item["status"] = "CARRIED_OVER"
                # Keep original meeting/source
                item["meeting_id"] = match.get("meeting_id") or match.get("db_id")
                
                original_title = match.get("originalMeeting") or match.get("originalMeetingTitle") or match.get("meetingTitle") or match.get("meeting_title") or "Previous Meeting"
                original_date = match.get("originalMeetingDate") or match.get("meetingDate") or match.get("meeting_date") or ""
                
                prev_title = match.get("meetingTitle") or match.get("meeting_title") or original_title
                prev_date = match.get("meetingDate") or match.get("meeting_date") or original_date
                
                item["originalMeeting"] = original_title
                item["originalMeetingTitle"] = original_title
                item["originalMeetingDate"] = original_date
                item["previousMeeting"] = prev_title
                item["previousMeetingTitle"] = prev_title
                item["previousMeetingDate"] = prev_date
                
                item["meetingTitle"] = original_title
                item["meetingDate"] = original_date
                original_source = match.get("sourceSnippet") or match.get("source_snippet")
                if original_source:
                    item["sourceSnippet"] = original_source
                if match.get("speaker"):
                    item["speaker"] = match["speaker"]
                original_detected = match.get("detectedAt") or match.get("detected_at")
                if original_detected:
                    item["detectedAt"] = original_detected
                item["aiReasoning"] = f"Carried over from previous meeting ('{prev_title}'). Original task was not completed ({prev_status})."
            else:
                item["status"] = "NEW"
                item["aiReasoning"] = "Previous matching action was COMPLETED; treat new occurrence as NEW."
        else:
            item["status"] = "NEW"
    return action_items

# ----------------- API ENDPOINTS -----------------

@app.get("/")
def root():
    return {"message": "AI Meeting-to-Accountability Backend API", "status": "running", "port": 8001}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "FastAPI Backend", "database": "SQLite", "port": 8001}

# 1. Get all meetings
@app.get("/api/meetings")
def get_meetings():
    return get_all_meetings_from_db()

# 2. Add / Process meeting transcript & create action items
@app.post("/api/meetings/process")
def process_meeting(req: ProcessMeetingRequest):
    if not req.title.strip() or not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Title and transcript are required.")

    # Extract action items with strict owner & deadline rules
    action_items = extract_action_items_from_transcript(req.transcript, req.date, req.title)

    # Apply CARRIED_OVER tracking from database
    existing_items = get_all_action_items_from_db()
    action_items = apply_carried_over_tracking(action_items, existing_items)

    attendees = list(set([item["owner"] for item in action_items if item["owner"] != "Not specified"]))

    meeting_dict = {
        "title": req.title.strip(),
        "date": req.date,
        "department": req.department or "General",
        "transcript": req.transcript,
        "summary": f"Processed {len(action_items)} action item(s).",
        "attendees": attendees
    }

    created_meeting, created_actions = insert_meeting_and_actions(meeting_dict, action_items)
    return {
        "meeting": created_meeting,
        "actionItems": created_actions
    }

# 3. Add plain meeting
@app.post("/api/meetings")
def add_meeting(req: ProcessMeetingRequest):
    return process_meeting(req)

# 4. Get all action items
@app.get("/api/action-items")
def get_action_items():
    return get_all_action_items_from_db()

# 5. Update action item status (NEW, COMPLETED, OVERDUE, CARRIED_OVER)
@app.patch("/api/action-items/{action_id}/status")
def update_action_status(action_id: str, req: UpdateStatusRequest):
    try:
        update_status_in_db(action_id, req.status)
        return {"success": True, "id": action_id, "status": req.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Dashboard statistics endpoint
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    meetings = get_all_meetings_from_db()
    action_items = get_all_action_items_from_db()

    total_meetings = len(meetings)
    total_actions = len(action_items)
    count_new = len([i for i in action_items if i["status"] == "NEW"])
    count_completed = len([i for i in action_items if i["status"] == "COMPLETED"])
    count_overdue = len([i for i in action_items if i["status"] == "OVERDUE"])
    count_carried = len([i for i in action_items if i["status"] in ("CARRIED OVER", "CARRIED_OVER")])

    return {
        "totalMeetings": total_meetings,
        "totalActionItems": total_actions,
        "countNew": count_new,
        "countCompleted": count_completed,
        "countOverdue": count_overdue,
        "countCarriedOver": count_carried
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
