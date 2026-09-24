import React from 'react';

const STATUS_OPTIONS = ['NEW', 'CARRIED_OVER', 'OVERDUE', 'COMPLETED'];

export default function AuditTrail({ actionItem, onClose, onUpdateStatus }) {
  if (!actionItem) return null;

  const handleStatusToggle = () => {
    const nextStatus = actionItem.status === 'COMPLETED' ? 'NEW' : 'COMPLETED';
    onUpdateStatus(actionItem.id, nextStatus);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'NEW': return 'status-badge new';
      case 'COMPLETED': return 'status-badge completed';
      case 'OVERDUE': return 'status-badge overdue';
      case 'CARRIED OVER':
      case 'CARRIED_OVER': return 'status-badge carried-over';
      default: return 'status-badge';
    }
  };

  const isCarriedOver =
    actionItem.status === 'CARRIED OVER' ||
    actionItem.status === 'CARRIED_OVER' ||
    Boolean(actionItem.previousMeeting) ||
    Boolean(actionItem.previousMeetingTitle);

  const originalMeetingTitle =
    actionItem.originalMeeting ||
    actionItem.originalMeetingTitle ||
    actionItem.meetingTitle ||
    'Meeting';

  const originalMeetingDate =
    actionItem.originalMeetingDate ||
    actionItem.meetingDate ||
    '';

  const previousMeetingTitle =
    actionItem.previousMeeting ||
    actionItem.previousMeetingTitle ||
    originalMeetingTitle;

  const previousMeetingDate =
    actionItem.previousMeetingDate ||
    originalMeetingDate ||
    '';

  return (
    <div className="modal-backdrop" onClick={onClose} id="audit-trail-modal-backdrop">
      <div className="audit-modal" onClick={(e) => e.stopPropagation()} id="audit-trail-modal">
        {/* Modal Header */}
        <div className="audit-modal-header">
          <div className="audit-header-title-wrap">
            <span className="audit-tag">Audit Trail</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {actionItem.id}</span>
          </div>
          <button
            id="audit-modal-close-btn"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            title="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="audit-modal-body">
          {/* Action Overview Card */}
          <div className="audit-hero-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div className="audit-action-title" id="audit-action-title">
                {actionItem.action}
              </div>
              
              {/* Interactive Status Selector */}
              <select
                id={`audit-status-select-${actionItem.id}`}
                className={getStatusClass(actionItem.status)}
                value={actionItem.status === 'CARRIED OVER' ? 'CARRIED_OVER' : actionItem.status}
                onChange={(e) => onUpdateStatus(actionItem.id, e.target.value)}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid currentColor',
                  appearance: 'auto'
                }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt} style={{ color: '#0f172a', background: '#ffffff', fontWeight: 600 }}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Core Metadata Grid: Owner, Deadline, Current status, Original meeting, Meeting date */}
            <div className="audit-meta-grid">
              {/* 1. Owner */}
              <div className="audit-meta-cell" id="audit-meta-owner">
                <span className="audit-meta-label">Owner</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <div
                    className="owner-avatar"
                    style={{ width: '24px', height: '24px', fontSize: '0.68rem', backgroundColor: actionItem.ownerColor || '#2563eb' }}
                  >
                    {actionItem.ownerInitials || actionItem.owner.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="audit-meta-value">{actionItem.owner}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{actionItem.ownerRole || 'Assignee'}</div>
                  </div>
                </div>
              </div>

              {/* 2. Deadline */}
              <div className="audit-meta-cell" id="audit-meta-deadline">
                <span className="audit-meta-label">Deadline</span>
                <span className={`audit-meta-value ${actionItem.status === 'OVERDUE' ? 'deadline-overdue' : ''}`} style={{ marginTop: '4px' }}>
                  {actionItem.deadline}
                </span>
              </div>

              {/* 3. Current Status */}
              <div className="audit-meta-cell" id="audit-meta-status">
                <span className="audit-meta-label">Current Status</span>
                <span className="audit-meta-value" style={{ marginTop: '4px' }}>
                  <span className={getStatusClass(actionItem.status)} style={{ display: 'inline-block' }}>
                    {actionItem.status}
                  </span>
                </span>
              </div>

              {/* 4. Original Meeting */}
              <div className="audit-meta-cell" id="audit-meta-original-meeting">
                <span className="audit-meta-label">Original Meeting</span>
                <span className="audit-meta-value" style={{ marginTop: '4px' }}>
                  {originalMeetingTitle}
                </span>
              </div>

              {/* 5. Meeting Date */}
              <div className="audit-meta-cell" id="audit-meta-meeting-date">
                <span className="audit-meta-label">Meeting Date</span>
                <span className="audit-meta-value" style={{ marginTop: '4px' }}>
                  {originalMeetingDate}
                </span>
              </div>
            </div>
          </div>

          {/* If the action was carried over, also show the previous meeting */}
          {isCarriedOver && (
            <div className="carried-over-box" id="audit-carried-over-box">
              <div className="carried-over-box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  <span>Carried Over From Previous Meeting</span>
                </div>
                <span className="status-badge carried-over" style={{ fontSize: '0.72rem' }}>
                  CARRIED OVER
                </span>
              </div>

              <div className="carried-over-grid">
                <div className="audit-meta-cell" id="audit-meta-previous-meeting">
                  <span className="audit-meta-label" style={{ color: '#b45309' }}>Previous Meeting</span>
                  <span className="audit-meta-value" style={{ color: '#92400e', fontWeight: 700, marginTop: '2px' }}>
                    {previousMeetingTitle}
                  </span>
                </div>

                {previousMeetingDate && (
                  <div className="audit-meta-cell" id="audit-meta-previous-meeting-date">
                    <span className="audit-meta-label" style={{ color: '#b45309' }}>Previous Meeting Date</span>
                    <span className="audit-meta-value" style={{ color: '#92400e', marginTop: '2px' }}>
                      {previousMeetingDate}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.76rem', color: '#92400e', opacity: 0.9 }}>
                * This commitment was carried over from an earlier meeting and tracked continuously in SQLite.
              </div>
            </div>
          )}

          {/* Source Transcript Verification Section */}
          <div className="transcript-source-box">
            <div className="transcript-source-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#38bdf8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>SOURCE TRANSCRIPT SNIPPET</span>
              </div>
              <span>Timestamp: {actionItem.detectedAt || 'Meeting recording log'}</span>
            </div>

            <div className="transcript-snippet-body">
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '8px' }}>
                // Speaker utterance verbatim transcript
              </div>
              <div className="transcript-speaker-highlight">
                Speaker: {actionItem.speaker || actionItem.owner}
              </div>
              <div className="transcript-quote-highlight">
                "{actionItem.sourceSnippet || actionItem.action}"
              </div>
            </div>
          </div>

          {/* Accountability Audit & Reasoning */}
          {actionItem.aiReasoning && (
            <div className="ai-audit-log">
              <div className="ai-audit-log-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#059669">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                  <span>Audit & Extraction Details</span>
                </div>
              </div>

              <div className="ai-reasoning-text">
                {actionItem.aiReasoning}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="audit-modal-footer">
          <button
            id="audit-modal-toggle-status-btn"
            className="btn btn-secondary"
            onClick={handleStatusToggle}
          >
            {actionItem.status === 'COMPLETED' ? 'Reopen Action Item' : '✓ Mark as Completed'}
          </button>

          <button
            id="audit-modal-done-btn"
            className="btn btn-primary"
            onClick={onClose}
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
