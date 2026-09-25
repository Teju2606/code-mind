/**
 * speechExtractor.js
 * High-precision, deterministic client-side extractor for voice transcripts.
 * Adheres strictly to spoken content: does not invent or hallucinate topics, owners, or deadlines.
 */

// Set of non-name words for strict person name validation
export const NON_NAME_WORDS = new Set([
  // Pronouns & determiners
  "we", "they", "everyone", "everybody", "someone", "somebody", "nobody", "noone", "no one",
  "anyone", "anybody", "it", "this", "that", "these", "those", "there", "here",
  "you", "the", "our", "my", "your", "their", "his", "her", "its", "all", "both",
  "each", "either", "neither", "none", "one", "some", "few", "many", "several",
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how",

  // Generic titles, roles & speaker tags
  "manager", "host", "admin", "moderator", "speaker", "facilitator", "organizer",
  "system", "server", "client", "bot", "assistant", "ai", "lead", "director",
  "engineer", "developer", "architect", "team", "folks", "guys", "people", "members",
  "unassigned", "transcript", "note", "notes", "recorder", "user", "attendee",

  // Common discourse markers & adverbs
  "yes", "no", "thanks", "thank", "ok", "okay", "sure", "great", "please", "also",
  "next", "let", "lets", "let's", "so", "well", "then", "now", "just", "actually",
  "basically", "essentially", "meanwhile", "furthermore", "moreover", "additionally",
  "however", "first", "firstly", "second", "secondly", "third", "finally", "lastly",
  "overall", "similarly", "definitely", "certainly", "probably", "possibly",
  "maybe", "perhaps", "regarding", "speaking", "under", "across", "before", "after",
  "during", "since", "until", "anyway", "anyways", "regardless", "instead", "otherwise",
  "currently", "already", "soon", "later", "again", "together",

  // Verbs / Modals
  "can", "could", "would", "should", "must", "will", "shall", "to", "as", "by",
  "for", "in", "on", "at", "if", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "going", "need", "needs", "agreed",
  "responsible", "handle", "and", "or", "but", "with", "about", "into", "through",

  // Tech & Domain terms
  "backend", "frontend", "api", "service", "project", "sprint", "issue", "bug",
  "task", "ticket", "feature", "build", "release", "deploy", "deployment",
  "documentation", "pr", "security", "audit", "database", "sql", "sqlite",
  "aws", "cloud", "server", "cluster", "model", "pipeline", "platform",

  // Days & Months
  "today", "tomorrow", "yesterday", "tonight", "eod",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december", "jan", "feb", "mar", "apr",
  "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",

  // Action / Status keywords
  "assigned", "action", "item", "deliverable", "milestone", "status", "update",
  "review", "report", "meeting", "roadmap", "plan", "summary"
]);

/**
 * Validates whether a candidate string is a plausible person's name.
 */
export function isValidPersonName(name) {
  if (!name || typeof name !== 'string') return false;
  const cleaned = name.trim().replace(/^[,.:;\-–—()[\]"']+|[,.:;\-–—()[\]"']+$/g, '');
  if (!cleaned) return false;
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0 || parts.length > 3) return false;

  for (const p of parts) {
    const pClean = p.replace(/[^a-zA-Z]/g, '');
    if (!pClean || pClean.length < 2) return false;
    if (NON_NAME_WORDS.has(pClean.toLowerCase())) return false;
    if (p[0] !== p[0].toUpperCase()) return false;
  }
  return true;
}

/**
 * Helper to calculate target date from meeting reference date
 */
export function calculateRelativeDate(keyword, refDate = new Date()) {
  const base = new Date(refDate);
  const lower = keyword.toLowerCase().trim();

  if (lower.includes('tomorrow')) {
    base.setDate(base.getDate() + 1);
    return base.toISOString().split('T')[0];
  }
  if (lower.includes('today') || lower.includes('tonight') || lower.includes('eod') || lower.includes('end of day')) {
    return base.toISOString().split('T')[0];
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const currentDay = base.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      base.setDate(base.getDate() + diff);
      return base.toISOString().split('T')[0];
    }
  }

  // Look for ISO date YYYY-MM-DD
  const isoMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  // Look for MM/DD or MM-DD
  const slashMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
  if (slashMatch) {
    const year = base.getFullYear();
    const month = String(slashMatch[1]).padStart(2, '0');
    const day = String(slashMatch[2]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return 'Not specified';
}

/**
 * Extracts key discussion topics from exact transcript without inventing information.
 */
export function extractTopicsFromTranscript(transcript) {
  if (!transcript || !transcript.trim()) return [];

  // Split transcript into discrete sentences or thoughts
  const rawSegments = transcript
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '') // Remove timestamps if present
    .split(/(?:\. |\.\n+|\n+|;|\?|!|\b(?:and also|moving on to|next topic|regarding|we talked about|we discussed|let's discuss|in addition)\b)/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  const topics = [];
  const greetingRegex = /^(?:good morning|good afternoon|good evening|hello|hi|welcome|hey)(?:\s+(?:everyone|team|all|folks|everybody))?[\s.!?,]*$/i;
  const fillerRegex = /^(?:um|uh|er|ah|like|you know|so basically|can you hear me|thanks everyone|okay so|let's start|let's begin)\b[\s,]*/i;

  for (const seg of rawSegments) {
    // Check if whole segment is a greeting
    if (greetingRegex.test(seg.trim())) continue;

    // Clean up segment
    let cleaned = seg.replace(fillerRegex, '').replace(/^[-*•\s]+/, '').trim();
    if (!cleaned || cleaned.length < 4) continue;
    if (greetingRegex.test(cleaned)) continue;

    // Remove speaker prefix if present (e.g. "Marcus: We discussed the API")
    cleaned = cleaned.replace(/^[A-Za-z0-9\s]+(?:\s*\([^)]*\))?:\s*/, '').trim();

    // Check for topic phrases
    const topicPattern = /(?:discussed|talking about|regarding|focus on|review of|update on|overview of|architecture of|status of|roadmap for|align on|alignment on)\s+([^.!?]+)/i;
    const match = cleaned.match(topicPattern);

    let topicText = '';
    if (match && match[1]) {
      topicText = match[1].trim();
    } else {
      topicText = cleaned;
    }

    // Strip leading articles/prepositions for cleaner topic labels
    topicText = topicText.replace(/^(?:the|a|an|our|their|some|about)\s+/i, '').trim();

    // Capitalize first character and remove trailing punctuation
    if (topicText.length > 0) {
      topicText = topicText.replace(/[.!?]+$/, '').trim();
      topicText = topicText.charAt(0).toUpperCase() + topicText.slice(1);
      // Avoid duplicates
      if (!topics.some(t => t.toLowerCase() === topicText.toLowerCase())) {
        topics.push(topicText);
      }
    }
  }

  // If no topics passed filters, fallback to original sentence breakdown
  if (topics.length === 0 && transcript.trim().length > 0) {
    const fallback = transcript
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '')
      .split(/[.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 3 && !greetingRegex.test(s));
    return fallback.length > 0 ? fallback : [transcript.trim()];
  }

  return topics.slice(0, 8); // Top relevant topics
}

/**
 * Extracts action items from exact transcript without inventing owners or deadlines.
 */
export function extractActionItemsFromTranscript(transcript, refDate = new Date()) {
  if (!transcript || !transcript.trim()) return [];

  // Split transcript into sentences
  const sentences = transcript
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 6);

  const actionItems = [];
  let itemIdCounter = 1;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    // Check for actionable cues
    const hasActionCue = /(?:will|commit(?:s|ted)? to|going to|needs? to|has to|have to|should|must|assigned to|action item:?|task:?|let's|please|follow up on|complete|finalize|implement|build|fix|test|deploy|send|update|audit|prepare|review|schedule|create)\b/i.test(sentence);

    if (!hasActionCue) continue;

    // Detect Owner
    let owner = 'Not specified';
    let speaker = null;

    // Check for speaker label e.g., "Marcus:" or "Marcus Vance (Engineering Lead):"
    const speakerMatch = sentence.match(/^([A-Za-z0-9\s]+?)(?:\s*\([^)]*\))?:\s*(.+)$/);
    let bodyText = sentence;
    if (speakerMatch) {
      const rawSpeaker = speakerMatch[1].trim();
      if (isValidPersonName(rawSpeaker)) {
        speaker = rawSpeaker;
      }
      bodyText = speakerMatch[2].trim();
    }

    // 1. First person commitment: "I will..." -> Speaker (or named speaker)
    if (/\b(?:i will|i commit|i'm going to|i'll|i need to|i have to)\b/i.test(bodyText)) {
      owner = speaker || 'Speaker';
    } else {
      // 2. Third person assignment e.g. "Marcus will complete..." or "Assigned to Sarah:..."
      const thirdPersonMatch = bodyText.match(/(?:assigned to|action item for|let's have)?\s*\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:will|to|needs? to|has to|is going to|should|must|agreed to|commits to)\b/i);
      if (thirdPersonMatch && thirdPersonMatch[1] && isValidPersonName(thirdPersonMatch[1])) {
        owner = thirdPersonMatch[1].trim();
      } else if (speaker && isValidPersonName(speaker)) {
        owner = speaker;
      } else {
        owner = 'Not specified';
      }
    }

    // Detect Deadline
    let deadline = 'Not specified';
    const deadlineKeywords = [
      'tomorrow', 'today', 'tonight', 'by eod', 'by end of day',
      'by friday', 'by monday', 'by tuesday', 'by wednesday', 'by thursday', 'by saturday', 'by sunday',
      'this friday', 'this monday', 'this tuesday', 'this wednesday', 'this thursday',
      'next week', 'this week', 'by next sprint', 'asap'
    ];

    for (const kw of deadlineKeywords) {
      if (lower.includes(kw)) {
        const calculated = calculateRelativeDate(kw, refDate);
        if (calculated !== 'Not specified') {
          deadline = calculated;
        } else {
          deadline = kw.charAt(0).toUpperCase() + kw.slice(1);
        }
        break;
      }
    }

    // Check for explicit ISO or formatted date
    const isoMatch = sentence.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (isoMatch) {
      deadline = isoMatch[1];
    }

    // Extract clean action description
    let action = bodyText
      .replace(/^(?:assigned to|action item:?|task:?)\s*/i, '')
      .replace(/^(?:[A-Z][a-z]+\s+)?(?:will|to|needs? to|has to|is going to|should|must|agreed to|commits? to)\s+/i, '')
      .replace(/^(?:i will|i commit to|i'm going to|i'll|i need to|we need to|we will|we should|let's|please)\s+/i, '')
      .replace(/\s+(?:by\s+(?:tomorrow|today|tonight|friday|monday|tuesday|wednesday|thursday|saturday|sunday|next week|eod|end of day|\d{4}-\d{2}-\d{2})|tomorrow|today|next week)$/i, '')
      .trim();

    if (action.length > 0) {
      action = action.charAt(0).toUpperCase() + action.slice(1);
      // Remove trailing punctuation
      action = action.replace(/[.!?]+$/, '');

      // Assign avatar color
      const avatarColors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
      const colorIndex = Math.abs(owner.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarColors.length;

      actionItems.push({
        id: `voice-action-${Date.now()}-${itemIdCounter++}`,
        action: action,
        owner: owner,
        ownerColor: owner === 'Not specified' ? '#64748b' : avatarColors[colorIndex],
        ownerInitials: owner === 'Not specified' ? 'NS' : owner.slice(0, 2).toUpperCase(),
        deadline: deadline,
        status: 'NEW',
        sourceSnippet: sentence.trim()
      });
    }
  }

  return actionItems;
}
