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
          <h2>Meeting Intake & Processing</h2>
          <p>Add a meeting title, date, and transcript to save to SQLite and extract action items below</p>
        </div>
      </div>

      {/* 1. Meeting Title, 2. Meeting Date, 3. Transcript Text Box, 4. Process Meeting Button */}
      <div className="form-card">
        <form onSubmit={handleProcess}>
          <div className="form-grid-2">
            {/* 1. Meeting Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="meeting-title-input">
                <span>Meeting Title</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>Required</span>
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
                <span>Meeting Date</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>YYYY-MM-DD</span>
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
              <span>Transcript Text Box</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>
                {transcript.length} characters
              </span>
            </div>
            <textarea
              id="meeting-transcript-textarea"
              className="form-textarea"
              placeholder="Paste raw transcript, speaker diarization logs, or meeting notes here...&#10;&#10;Example:&#10;[00:04:45] Marcus Vance: I will finalize the SCIM sync documentation and PR by this Friday, September 25th.&#10;[00:06:30] Elena Rostova: I commit to auditing all active session revocation hooks by September 28th."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              required
            ></textarea>
          </div>

          {/* 4. Process Meeting Button */}
          <div className="form-actions-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#10b981">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Saved to SQLite database with automatic action extraction</span>
            </div>

            <button
              id="process-meeting-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="pulse-dot"></span>
                  Processing & Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Process Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* EXTRACTED ACTION ITEMS (Displayed below when Process Meeting is clicked) */}
      {lastExtractedItems && lastExtractedItems.length > 0 && (
        <div id="extracted-action-items-section" className="panel-card" style={{ marginBottom: '28px', border: '1px solid #93c5fd', boxShadow: 'var(--shadow-md)' }}>
          <div className="panel-header" style={{ background: '#f0f7ff', borderBottom: '1px solid #bfdbfe' }}>
            <div className="panel-title" style={{ color: '#1e40af' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="#2563eb">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Extracted Action Items ({lastExtractedItems.length}) — {processedMeetingInfo?.title}
            </div>
            <span style={{ fontSize: '0.78rem', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
              Saved to SQLite • Date: {processedMeetingInfo?.date}
            </span>
          </div>

          <div className="panel-body" style={{ padding: 0 }}>
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
                    style={{ cursor: onSelectAction ? 'pointer' : 'default' }}
                    title="Click to view audit details"
                  >
                    {/* Action */}
                    <td className="table-action-cell">
                      <div className="action-title-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.action}
                      </div>
                      {item.sourceSnippet && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          Source: "{item.sourceSnippet}"
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
                          {item.ownerInitials || item.owner.slice(0, 2).toUpperCase()}
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
                        {item.status}
                      </span>
                    </td>

                    {/* Audit Button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        id={`btn-extracted-audit-${item.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectAction) onSelectAction(item);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Processed Meetings Archive (From SQLite) */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#2563eb">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Meetings in SQLite Database ({meetings.length})
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Meeting Title</th>
                <th>Date</th>
                <th>Attendees</th>
                <th>Summary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    No meetings yet
                  </td>
                </tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.title}
                    </td>
                    <td>{m.date}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {Array.isArray(m.attendees) ? m.attendees.join(', ') : 'Team members'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {m.summary}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedPastMeeting(selectedPastMeeting?.id === m.id ? null : m)}
                      >
                        {selectedPastMeeting?.id === m.id ? 'Hide Transcript' : 'View Transcript'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Inline Transcript Viewer for Selected Past Meeting */}
          {selectedPastMeeting && (
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-default)', background: '#fafbfd' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Full Transcript: {selectedPastMeeting.title} ({selectedPastMeeting.date})
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedPastMeeting(null)}
                >
                  ✕ Close
                </button>
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: '1.6',
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                whiteSpace: 'pre-wrap',
                maxHeight: '260px',
                overflowY: 'auto'
              }}>
                {selectedPastMeeting.transcript}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
