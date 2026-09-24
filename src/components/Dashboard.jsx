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

  // Urgent items needing attention (OVERDUE or HIGH/CRITICAL priority NEW items or CARRIED_OVER)
  const attentionItems = actionItems.filter(
    item => item.status === 'OVERDUE' || item.priority === 'CRITICAL' || item.status === 'CARRIED OVER' || item.status === 'CARRIED_OVER'
  ).slice(0, 4);

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Accountability Overview</h2>
          <p>Real-time SQLite metrics, status distribution, and commitment tracking</p>
        </div>
        <div className="page-header-actions">
          <button
            id="dash-process-transcript-btn"
            className="btn btn-primary"
            onClick={() => onNavigate('meetings')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Process New Transcript
          </button>
        </div>
      </div>

      {/* 6 Required Metric Cards */}
      <div className="metrics-grid">
        {/* Total Meetings */}
        <div
          id="card-total-meetings"
          className="metric-card total-meetings"
          onClick={() => onNavigate('meetings')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-title">Total Meetings</span>
            <div className="metric-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{totalMeetings}</div>
          <div className="metric-footer">
            <span>Recorded in SQLite</span>
          </div>
        </div>

        {/* Total Action Items */}
        <div
          id="card-total-actions"
          className="metric-card total-actions"
          onClick={() => {
            onFilterByStatus('ALL');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-title">Total Action Items</span>
            <div className="metric-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
          </div>
          <div className="metric-value">{totalActions}</div>
          <div className="metric-footer">
            <span>Extracted commitments</span>
          </div>
        </div>

        {/* New */}
        <div
          id="card-status-new"
          className="metric-card new"
          onClick={() => {
            onFilterByStatus('NEW');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-title">New</span>
            <div className="metric-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: '#2563eb' }}>{countNew}</div>
          <div className="metric-footer">
            <span>Recently Added</span>
          </div>
        </div>

        {/* Carried Over */}
        <div
          id="card-status-carried-over"
          className="metric-card carried-over"
          onClick={() => {
            onFilterByStatus('CARRIED OVER');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-title">Carried Over</span>
            <div className="metric-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: '#d97706' }}>{countCarriedOver}</div>
          <div className="metric-footer">
            <span>Multi-sprint commitments</span>
          </div>
        </div>

        {/* Overdue */}
        <div
          id="card-status-overdue"
          className="metric-card overdue"
          onClick={() => {
            onFilterByStatus('OVERDUE');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-title">Overdue</span>
            <div className="metric-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: '#dc2626' }}>{countOverdue}</div>
          <div className="metric-footer">
            <span>Requires escalation</span>
          </div>
        </div>

        {/* Completed */}
        <div
          id="card-status-completed"
          className="metric-card completed"
          onClick={() => {
            onFilterByStatus('COMPLETED');
            onNavigate('actions');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-title">Completed</span>
            <div className="metric-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div className="metric-value" style={{ color: '#059669' }}>{countCompleted}</div>
          <div className="metric-footer">
            <span>Verified & Closed</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="dashboard-split-grid">
        {/* Left Panel: High Priority Items & Recent Activity */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#2563eb">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Attention & Escalations
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('actions')}
            >
              View All Actions →
            </button>
          </div>

          <div className="panel-body" style={{ padding: 0 }}>
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Action Item</th>
                  <th>Owner</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                {attentionItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                      No action items yet
                    </td>
                  </tr>
                ) : (
                  attentionItems.map(item => (
                    <tr key={item.id} onClick={() => onSelectAction(item)}>
                      <td className="table-action-cell">
                        <div className="action-title-text">{item.action}</div>
                        <div className="action-meeting-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          </svg>
                          {item.meetingTitle}
                        </div>
                      </td>
                      <td>
                        <div className="owner-cell-wrap">
                          <div className="owner-avatar" style={{ backgroundColor: item.ownerColor || '#2563eb' }}>
                            {item.ownerInitials}
                          </div>
                          <div className="owner-info">
                            <span className="owner-name">{item.owner}</span>
                            <span className="owner-role">{item.ownerRole}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`deadline-wrap ${item.status === 'OVERDUE' ? 'deadline-overdue' : ''}`}>
                          {item.deadline}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAction(item);
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Status Distribution & Recent Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Breakdown Card */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#475569">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
                Status Breakdown
              </div>
            </div>
            <div className="panel-body">
              <div className="status-bar-wrapper">
                <div className="status-bar-track">
                  <div className="status-bar-seg new" style={{ width: `${pctNew}%` }} title={`New: ${pctNew}%`}></div>
                  <div className="status-bar-seg carried" style={{ width: `${pctCarried}%` }} title={`Carried Over: ${pctCarried}%`}></div>
                  <div className="status-bar-seg overdue" style={{ width: `${pctOverdue}%` }} title={`Overdue: ${pctOverdue}%`}></div>
                  <div className="status-bar-seg completed" style={{ width: `${pctCompleted}%` }} title={`Completed: ${pctCompleted}%`}></div>
                </div>
              </div>

              <div className="status-legend-grid">
                <div className="status-legend-item">
                  <span className="status-legend-label">
                    <span className="status-dot new"></span>
                    New
                  </span>
                  <span className="status-legend-count">{countNew}</span>
                </div>
                <div className="status-legend-item">
                  <span className="status-legend-label">
                    <span className="status-dot carried"></span>
                    Carried Over
                  </span>
                  <span className="status-legend-count">{countCarriedOver}</span>
                </div>
                <div className="status-legend-item">
                  <span className="status-legend-label">
                    <span className="status-dot overdue"></span>
                    Overdue
                  </span>
                  <span className="status-legend-count">{countOverdue}</span>
                </div>
                <div className="status-legend-item">
                  <span className="status-legend-label">
                    <span className="status-dot completed"></span>
                    Completed
                  </span>
                  <span className="status-legend-count">{countCompleted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Meetings Card */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#475569">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Recent Meetings
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('meetings')}
              >
                All →
              </button>
            </div>
            <div className="panel-body" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {meetings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No meetings yet
                  </div>
                ) : (
                  meetings.slice(0, 3).map(m => (
                    <div
                      key={m.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        border: '1px solid var(--border-default)'
                      }}
                      onClick={() => onNavigate('meetings')}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {m.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>{m.department || 'General'}</span>
                        <span>{m.date}</span>
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
