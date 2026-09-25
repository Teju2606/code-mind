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
            <div className="audit-header-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div className="audit-title-text-group">
              <span className="audit-tag">Audit Trail & Lineage</span>
              <span className="audit-id-badge">ID: {actionItem.id}</span>
            </div>
          </div>
          <button
            id="audit-modal-close-btn"
            className="btn-icon audit-close-btn"
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="audit-modal-body">
          {/* Action Overview Hero Card */}
          <div className="audit-hero-card">
            <div className="audit-hero-top-row">
              <div className="audit-action-title" id="audit-action-title">
                {actionItem.action}
              </div>
              
              {/* Interactive Status Selector */}
              <div className="audit-status-selector-wrap">
                <label className="audit-status-label">Status Selector:</label>
                <select
                  id={`audit-status-select-${actionItem.id}`}
                  className={getStatusClass(actionItem.status)}
                  value={actionItem.status === 'CARRIED OVER' ? 'CARRIED_OVER' : actionItem.status}
                  onChange={(e) => onUpdateStatus(actionItem.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt} style={{ color: '#0f172a', background: '#ffffff', fontWeight: 600 }}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Core Metadata Grid: Owner, Deadline, Current status, Original meeting, Meeting date */}
            <div className="audit-meta-grid">
              {/* 1. Owner */}
              <div className="audit-meta-cell" id="audit-meta-owner">
                <span className="audit-meta-label">Assigned Owner</span>
                <div className="audit-owner-row">
                  <div
                    className="owner-avatar audit-avatar"
                    style={{ backgroundColor: actionItem.ownerColor || '#2563eb' }}
                  >
                    {actionItem.ownerInitials || actionItem.owner?.slice(0, 2).toUpperCase() || 'TM'}
                  </div>
                  <div className="audit-owner-details">
                    <span className="audit-meta-value">{actionItem.owner}</span>
                    <span className="audit-role-subtext">{actionItem.ownerRole || 'Assignee'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Deadline */}
              <div className="audit-meta-cell" id="audit-meta-deadline">
                <span className="audit-meta-label">Target Deadline</span>
                <div className={`audit-meta-value-box ${actionItem.status === 'OVERDUE' ? 'box-overdue' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="audit-meta-value">{actionItem.deadline}</span>
                </div>
              </div>

              {/* 3. Current Status */}
              <div className="audit-meta-cell" id="audit-meta-status">
                <span className="audit-meta-label">Current Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={getStatusClass(actionItem.status)}>
                    <span className="status-badge-dot"></span>
                    {actionItem.status}
                  </span>
                </div>
              </div>

              {/* 4. Original Meeting */}
              <div className="audit-meta-cell" id="audit-meta-original-meeting">
                <span className="audit-meta-label">Original Meeting</span>
                <div className="audit-meta-value-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  </svg>
                  <span className="audit-meta-value ellipsis">{originalMeetingTitle}</span>
                </div>
              </div>

              {/* 5. Meeting Date */}
              <div className="audit-meta-cell" id="audit-meta-meeting-date">
                <span className="audit-meta-label">Meeting Date</span>
                <div className="audit-meta-value-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="audit-meta-value">{originalMeetingDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* If the action was carried over, also show the previous meeting */}
          {isCarriedOver && (
            <div className="carried-over-box" id="audit-carried-over-box">
              <div className="carried-over-box-header">
                <div className="carried-over-header-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  <span>Carried Over From Previous Meeting</span>
                </div>
                <span className="status-badge carried-over">
                  <span className="status-badge-dot"></span>
                  CARRIED OVER
                </span>
              </div>

              <div className="carried-over-grid">
                <div className="audit-meta-cell" id="audit-meta-previous-meeting">
                  <span className="audit-meta-label carried-label">Previous Meeting</span>
                  <div className="carried-val-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    </svg>
                    <span className="audit-meta-value carried-text">{previousMeetingTitle}</span>
                  </div>
                </div>

                {previousMeetingDate && (
                  <div className="audit-meta-cell" id="audit-meta-previous-meeting-date">
                    <span className="audit-meta-label carried-label">Previous Meeting Date</span>
                    <div className="carried-val-box">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                      <span className="audit-meta-value carried-text">{previousMeetingDate}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="carried-over-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>This commitment was detected in an earlier meeting and continuously tracked across sprint cycles in SQLite.</span>
              </div>
            </div>
          )}

          {/* Source Transcript Verification Section */}
          <div className="transcript-source-box">
            <div className="transcript-source-header">
              <div className="transcript-source-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#38bdf8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>VERBATIM TRANSCRIPT SNIPPET</span>
              </div>
              <span className="timestamp-badge">Logged: {actionItem.detectedAt || 'Meeting recording log'}</span>
            </div>

            <div className="transcript-snippet-body">
              <div className="transcript-speaker-highlight">
                <span className="speaker-label">Speaker:</span> {actionItem.speaker || actionItem.owner}
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
                <div className="ai-audit-heading">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#059669">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                  <span>Audit & Extraction Details</span>
                </div>
                <span className="audit-verified-pill">Verified Record</span>
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
            className={`btn ${actionItem.status === 'COMPLETED' ? 'btn-secondary' : 'btn-success'}`}
            onClick={handleStatusToggle}
          >
            {actionItem.status === 'COMPLETED' ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                <span>Reopen Action Item</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Mark as Completed</span>
              </>
            )}
          </button>

          <button
            id="audit-modal-done-btn"
            className="btn btn-primary"
            onClick={onClose}
          >
            <span>Close Audit Trail</span>
          </button>
        </div>
      </div>
    </div>
  );
}
