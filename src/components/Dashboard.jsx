import React from 'react';

export default function Dashboard({
  meetings,
  actionItems,
  onSelectAction,
  onNavigate,
  onFilterByStatus
}) {
  const totalMeetings = meetings.length;
  const totalActions = actionItems.length;

  const countNew = actionItems.filter(item => item.status === 'NEW').length;
  const countCarriedOver = actionItems.filter(item => item.status === 'CARRIED OVER' || item.status === 'CARRIED_OVER').length;
  const countOverdue = actionItems.filter(item => item.status === 'OVERDUE').length;
  const countCompleted = actionItems.filter(item => item.status === 'COMPLETED').length;

  // Percentage calculations for status bar
  const pctNew = totalActions ? ((countNew / totalActions) * 100).toFixed(1) : 0;
  const pctCarried = totalActions ? ((countCarriedOver / totalActions) * 100).toFixed(1) : 0;
  const pctOverdue = totalActions ? ((countOverdue / totalActions) * 100).toFixed(1) : 0;
  const pctCompleted = totalActions ? ((countCompleted / totalActions) * 100).toFixed(1) : 0;

  // Attention items (OVERDUE, CRITICAL, or CARRIED_OVER)
  const attentionItems = actionItems.filter(
    item => item.status === 'OVERDUE' || item.priority === 'CRITICAL' || item.status === 'CARRIED OVER' || item.status === 'CARRIED_OVER'
  ).slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Modern SaaS Hero Header */}
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-subtitle-tag">
            <span className="live-indicator"></span>
            <span>Real-time Workspace Telemetry • SQLite Live</span>
          </div>
          <h2>Executive Accountability Overview</h2>
          <p>Real-time SQLite metrics, status distribution, and commitment tracking</p>
        </div>
        <div className="page-header-actions">
          <button
            id="dash-process-transcript-btn"
            className="btn btn-primary btn-hero-cta"
            onClick={() => onNavigate('meetings')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Process New Transcript</span>
          </button>
        </div>
      </div>

      {/* 6 Large Attractive Dashboard Stat Cards */}
      <div className="metrics-grid">
        {/* 1. Total Meetings */}
        <div
          id="card-total-meetings"
          className="metric-card total-meetings"
          onClick={() => onNavigate('meetings')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="metric-card-top">
            <span className="metric-title">Total Meetings</span>
            <div className="metric-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value">{totalMeetings}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-pill">SQLite Database</span>
            <span className="metric-subtext">Recorded in SQLite</span>
          </div>
        </div>

        {/* 2. Total Action Items */}
        <div
          id="card-total-actions"
          className="metric-card total-actions"
          onClick={() => {
            onFilterByStatus('ALL');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="metric-card-top">
            <span className="metric-title">Total Action Items</span>
            <div className="metric-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value">{totalActions}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-pill">Commitment Ledger</span>
            <span className="metric-subtext">Extracted commitments</span>
          </div>
        </div>

        {/* 3. New */}
        <div
          id="card-status-new"
          className="metric-card new"
          onClick={() => {
            onFilterByStatus('NEW');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="metric-card-top">
            <span className="metric-title">New</span>
            <div className="metric-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value color-new">{countNew}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-pill pill-new">Active Intake</span>
            <span className="metric-subtext">Recently Added</span>
          </div>
        </div>

        {/* 4. Carried Over */}
        <div
          id="card-status-carried-over"
          className="metric-card carried-over"
          onClick={() => {
            onFilterByStatus('CARRIED OVER');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="metric-card-top">
            <span className="metric-title">Carried Over</span>
            <div className="metric-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </div>
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value color-carried">{countCarriedOver}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-pill pill-carried">Multi-Sprint</span>
            <span className="metric-subtext">Multi-sprint commitments</span>
          </div>
        </div>

        {/* 5. Overdue */}
        <div
          id="card-status-overdue"
          className="metric-card overdue"
          onClick={() => {
            onFilterByStatus('OVERDUE');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="metric-card-top">
            <span className="metric-title">Overdue</span>
            <div className="metric-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value color-overdue">{countOverdue}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-pill pill-overdue">Requires Action</span>
            <span className="metric-subtext">Requires escalation</span>
          </div>
        </div>

        {/* 6. Completed */}
        <div
          id="card-status-completed"
          className="metric-card completed"
          onClick={() => {
            onFilterByStatus('COMPLETED');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="metric-card-top">
            <span className="metric-title">Completed</span>
            <div className="metric-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value color-completed">{countCompleted}</span>
          </div>
          <div className="metric-footer">
            <span className="metric-pill pill-completed">Verified</span>
            <span className="metric-subtext">Verified & Closed</span>
          </div>
        </div>
      </div>

      {/* SaaS Feature Workflow Highlights (Fills layout cleanly) */}
      <div className="workflow-banner-grid">
        <div className="workflow-item-card" onClick={() => onNavigate('meetings')} style={{ cursor: 'pointer' }}>
          <div className="workflow-icon-box bg-blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="workflow-text">
            <h4>1. Meeting Intake & Diarization</h4>
            <p>Paste raw transcripts, speaker notes, or meeting audio logs to index directly in SQLite.</p>
          </div>
        </div>

        <div className="workflow-item-card" onClick={() => onNavigate('actions')} style={{ cursor: 'pointer' }}>
          <div className="workflow-icon-box bg-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div className="workflow-text">
            <h4>2. Automated Commitment Extraction</h4>
            <p>Identifies owners, calculates deadline offsets, and categorizes action priority in real time.</p>
          </div>
        </div>

        <div className="workflow-item-card" onClick={() => onNavigate('actions')} style={{ cursor: 'pointer' }}>
          <div className="workflow-icon-box bg-emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="workflow-text">
            <h4>3. Multi-Sprint Audit Lineage</h4>
            <p>Maintains verbatim source snippets, original meeting origin, and carry-over history.</p>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="dashboard-split-grid">
        {/* Left Panel: Attention & Escalations */}
        <div className="panel-card attention-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="panel-icon-wrap alert-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <span>Attention & Escalations</span>
              {attentionItems.length > 0 && (
                <span className="badge-count-pill alert">{attentionItems.length}</span>
              )}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('actions')}
            >
              <span>View All Actions</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="panel-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th style={{ width: '42%' }}>Action Item</th>
                    <th style={{ width: '22%' }}>Owner</th>
                    <th style={{ width: '16%' }}>Deadline</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-empty-cell">
                        <div className="empty-state-wrap">
                          <div className="empty-state-icon">
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          </div>
                          <div className="empty-state-title">No action items yet</div>
                          <div className="empty-state-desc">All commitments are on schedule or no items have been imported into SQLite yet.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attentionItems.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => onSelectAction(item)}
                        className={`table-row-interactive ${item.status === 'OVERDUE' ? 'row-overdue' : ''}`}
                      >
                        <td className="table-action-cell">
                          <div className="action-title-text">{item.action}</div>
                          <div className="action-meeting-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            </svg>
                            <span>{item.meetingTitle}</span>
                          </div>
                        </td>
                        <td>
                          <div className="owner-cell-wrap">
                            <div className="owner-avatar" style={{ backgroundColor: item.ownerColor || '#2563eb' }}>
                              {item.ownerInitials || item.owner?.slice(0, 2).toUpperCase() || 'TM'}
                            </div>
                            <div className="owner-info">
                              <span className="owner-name">{item.owner}</span>
                              <span className="owner-role">{item.ownerRole || 'Assignee'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`deadline-wrap ${item.status === 'OVERDUE' ? 'deadline-overdue' : ''}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>{item.deadline}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            <span className="status-badge-dot"></span>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm inspect-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAction(item);
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel: Status Breakdown & Recent Meetings */}
        <div className="dashboard-side-column">
          {/* Status Breakdown Card */}
          <div className="panel-card breakdown-card">
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-icon-wrap chart-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                </div>
                <span>Status Breakdown</span>
              </div>
            </div>
            <div className="panel-body">
              {/* Multi-segment Progress Bar */}
              <div className="status-bar-wrapper">
                <div className="status-bar-track">
                  <div className="status-bar-seg new" style={{ width: `${pctNew}%` }} title={`New: ${pctNew}%`}></div>
                  <div className="status-bar-seg carried" style={{ width: `${pctCarried}%` }} title={`Carried Over: ${pctCarried}%`}></div>
                  <div className="status-bar-seg overdue" style={{ width: `${pctOverdue}%` }} title={`Overdue: ${pctOverdue}%`}></div>
                  <div className="status-bar-seg completed" style={{ width: `${pctCompleted}%` }} title={`Completed: ${pctCompleted}%`}></div>
                </div>
              </div>

              {/* Status Breakdown Legend Grid */}
              <div className="status-legend-grid">
                <div
                  className="status-legend-item"
                  onClick={() => {
                    onFilterByStatus('NEW');
                    onNavigate('actions');
                  }}
                >
                  <div className="status-legend-label">
                    <span className="status-dot new"></span>
                    <span>New</span>
                  </div>
                  <div className="status-legend-values">
                    <span className="status-legend-count">{countNew}</span>
                    <span className="status-legend-pct">{pctNew}%</span>
                  </div>
                </div>

                <div
                  className="status-legend-item"
                  onClick={() => {
                    onFilterByStatus('CARRIED OVER');
                    onNavigate('actions');
                  }}
                >
                  <div className="status-legend-label">
                    <span className="status-dot carried"></span>
                    <span>Carried Over</span>
                  </div>
                  <div className="status-legend-values">
                    <span className="status-legend-count">{countCarriedOver}</span>
                    <span className="status-legend-pct">{pctCarried}%</span>
                  </div>
                </div>

                <div
                  className="status-legend-item"
                  onClick={() => {
                    onFilterByStatus('OVERDUE');
                    onNavigate('actions');
                  }}
                >
                  <div className="status-legend-label">
                    <span className="status-dot overdue"></span>
                    <span>Overdue</span>
                  </div>
                  <div className="status-legend-values">
                    <span className="status-legend-count">{countOverdue}</span>
                    <span className="status-legend-pct">{pctOverdue}%</span>
                  </div>
                </div>

                <div
                  className="status-legend-item"
                  onClick={() => {
                    onFilterByStatus('COMPLETED');
                    onNavigate('actions');
                  }}
                >
                  <div className="status-legend-label">
                    <span className="status-dot completed"></span>
                    <span>Completed</span>
                  </div>
                  <div className="status-legend-values">
                    <span className="status-legend-count">{countCompleted}</span>
                    <span className="status-legend-pct">{pctCompleted}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Meetings Card */}
          <div className="panel-card recent-meetings-card">
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-icon-wrap calendar-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <span>Recent Meetings</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('meetings')}
              >
                <span>All Meetings</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="panel-body" style={{ padding: '14px 16px' }}>
              <div className="recent-meetings-list">
                {meetings.length === 0 ? (
                  <div className="empty-state-mini">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>No meetings yet</span>
                  </div>
                ) : (
                  meetings.slice(0, 4).map(m => (
                    <div
                      key={m.id}
                      className="meeting-mini-item"
                      onClick={() => onNavigate('meetings')}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="meeting-mini-header">
                        <span className="meeting-mini-title">{m.title}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                      <div className="meeting-mini-meta">
                        <span className="meeting-dept-badge">{m.department || 'General'}</span>
                        <span className="meeting-date-text">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                          </svg>
                          {m.date}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
