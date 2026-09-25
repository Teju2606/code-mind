import React, { useState } from 'react';

export default function TranscriptInput({ meetings, onProcessMeeting, onSelectMeetingTranscript, onSelectAction }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExtractedItems, setLastExtractedItems] = useState(null);
  const [processedMeetingInfo, setProcessedMeetingInfo] = useState(null);
  const [selectedPastMeeting, setSelectedPastMeeting] = useState(null);

  // Process meeting transcript via FastAPI backend (SQLite)
  const handleProcess = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a Meeting Title.');
      return;
    }
    if (!transcript.trim()) {
      alert('Please paste or enter some transcript text.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await onProcessMeeting({
        title: title.trim(),
        date: date,
        transcript: transcript.trim(),
        department: 'General'
      });

      if (result && result.actionItems) {
        setProcessedMeetingInfo(result.meeting);
        setLastExtractedItems(result.actionItems);
      }
    } catch (err) {
      console.error('Error processing meeting:', err);
      alert('Failed to process meeting. Please check if the backend server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="transcript-section">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-subtitle-tag">
            <span className="live-indicator"></span>
            <span>Automated AI Extraction Engine</span>
          </div>
          <h2>Meeting Intake & Processing</h2>
          <p>Add a meeting title, date, and transcript to save to SQLite and extract action items below</p>
        </div>
      </div>

      {/* 1. Meeting Title, 2. Meeting Date, 3. Transcript Text Box, 4. Process Meeting Button */}
      <div className="form-card intake-form-card">
        <form onSubmit={handleProcess}>
          <div className="form-grid-2">
            {/* 1. Meeting Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="meeting-title-input">
                <span className="label-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Meeting Title
                </span>
                <span className="label-badge required">Required</span>
              </label>
              <input
                id="meeting-title-input"
                className="form-input"
                type="text"
                placeholder="e.g., Sprint 43 Architecture Alignment & Deliverables"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 2. Meeting Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="meeting-date-input">
                <span className="label-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Meeting Date
                </span>
                <span className="label-badge">YYYY-MM-DD</span>
              </label>
              <input
                id="meeting-date-input"
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 3. Transcript Text Box */}
          <div className="form-group">
            <div className="form-label">
              <span className="label-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="10" x2="3" y2="10"></line>
                  <line x1="21" y1="6" x2="3" y2="6"></line>
                  <line x1="21" y1="14" x2="3" y2="14"></line>
                  <line x1="21" y1="18" x2="3" y2="18"></line>
                </svg>
                Transcript Text Box
              </span>
              <span className="char-counter-pill">
                {transcript.length} characters
              </span>
            </div>
            <div className="textarea-container">
              <textarea
                id="meeting-transcript-textarea"
                className="form-textarea"
                placeholder="Paste raw transcript, speaker diarization logs, or meeting notes here...&#10;&#10;Format examples:&#10;[00:04:45] Marcus Vance: I will finalize the SCIM sync documentation by this Friday.&#10;[00:06:30] Elena Rostova: I commit to auditing all active session revocation hooks by 2026-09-28."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                required
              ></textarea>
            </div>
          </div>

          {/* 4. Process Meeting Button */}
          <div className="form-actions-row">
            <div className="form-sync-indicator">
              <div className="sync-icon-glow">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span>Saved to SQLite database with automated accountability tracking</span>
            </div>

            <button
              id="process-meeting-btn"
              type="submit"
              className="btn btn-primary process-btn"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border"></span>
                  <span>Processing & Saving...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <span>Process Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* EXTRACTED ACTION ITEMS (Displayed below when Process Meeting is clicked) */}
      {lastExtractedItems && lastExtractedItems.length > 0 && (
        <div id="extracted-action-items-section" className="panel-card extracted-panel-card">
          <div className="panel-header extracted-panel-header">
            <div className="panel-title">
              <div className="panel-icon-wrap success-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>Extracted Action Items ({lastExtractedItems.length}) — {processedMeetingInfo?.title}</span>
            </div>
            <div className="extracted-status-pill">
              <span className="pulse-dot"></span>
              <span>Saved in SQLite • {processedMeetingInfo?.date}</span>
            </div>
          </div>

          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="enterprise-table" id="extracted-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '42%' }}>Action</th>
                    <th style={{ width: '22%' }}>Owner</th>
                    <th style={{ width: '16%' }}>Deadline</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {lastExtractedItems.map((item) => (
                    <tr
                      key={item.id}
                      id={`extracted-row-${item.id}`}
                      onClick={() => onSelectAction && onSelectAction(item)}
                      className="table-row-interactive"
                      title="Click to view audit details"
                    >
                      {/* Action */}
                      <td className="table-action-cell">
                        <div className="action-title-text">
                          {item.action}
                        </div>
                        {item.sourceSnippet && (
                          <div className="source-snippet-preview">
                            "{item.sourceSnippet}"
                          </div>
                        )}
                      </td>

                      {/* Owner */}
                      <td>
                        <div className="owner-cell-wrap">
                          <div
                            className="owner-avatar"
                            style={{ backgroundColor: item.ownerColor || '#2563eb' }}
                          >
                            {item.ownerInitials || item.owner?.slice(0, 2).toUpperCase() || 'TM'}
                          </div>
                          <div className="owner-info">
                            <span className="owner-name">{item.owner}</span>
                            <span className="owner-role">{item.ownerRole || 'Assignee'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Deadline */}
                      <td>
                        <div className="deadline-wrap">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{item.deadline}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          <span className="status-badge-dot"></span>
                          {item.status}
                        </span>
                      </td>

                      {/* Audit Button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          id={`btn-extracted-audit-${item.id}`}
                          className="btn btn-secondary btn-sm audit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectAction) onSelectAction(item);
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Processed Meetings Archive (From SQLite) */}
      <div className="panel-card archive-panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <div className="panel-icon-wrap db-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span>Meetings in SQLite Database ({meetings.length})</span>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Meeting Title</th>
                  <th style={{ width: '15%' }}>Date</th>
                  <th style={{ width: '22%' }}>Attendees</th>
                  <th style={{ width: '23%' }}>Summary</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty-cell">
                      <div className="empty-state-wrap">
                        <div className="empty-state-icon">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </div>
                        <div className="empty-state-title">No meetings yet</div>
                        <div className="empty-state-desc">Enter a title, date, and transcript above to record your first meeting in SQLite.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  meetings.map((m) => (
                    <tr key={m.id} className="table-row-hover">
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div className="meeting-archive-title-wrap">
                          <span className="archive-title-text">{m.title}</span>
                          <span className="archive-dept-tag">{m.department || 'General'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-badge-pill">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span>{m.date}</span>
                        </div>
                      </td>
                      <td>
                        <span className="attendees-text">
                          {Array.isArray(m.attendees) && m.attendees.length > 0
                            ? m.attendees.join(', ')
                            : 'Team members'}
                        </span>
                      </td>
                      <td>
                        <span className="summary-preview-text">
                          {m.summary}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm transcript-toggle-btn"
                          onClick={() => setSelectedPastMeeting(selectedPastMeeting?.id === m.id ? null : m)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <span>{selectedPastMeeting?.id === m.id ? 'Hide' : 'Transcript'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Inline Transcript Viewer for Selected Past Meeting */}
          {selectedPastMeeting && (
            <div className="transcript-viewer-drawer">
              <div className="drawer-header">
                <div className="drawer-title-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" color="#3b82f6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  </svg>
                  <span className="drawer-title">
                    Transcript: {selectedPastMeeting.title} ({selectedPastMeeting.date})
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedPastMeeting(null)}
                >
                  ✕ Close
                </button>
              </div>
              <pre className="drawer-transcript-code">
                {selectedPastMeeting.transcript}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
