import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, counts, accountabilityScore = 87 }) {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div className="brand-info">
          <span className="brand-title">AccountaMind</span>
          <span className="brand-subtitle">AI Accountability</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Workspace</div>

        <button
          id="nav-dashboard-btn"
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="nav-item-content">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            <span className="nav-text">Dashboard</span>
          </div>
        </button>

        <button
          id="nav-meetings-btn"
          className={`nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
          onClick={() => setActiveTab('meetings')}
        >
          <div className="nav-item-content">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className="nav-text">Meetings</span>
          </div>
          {counts?.meetings > 0 && (
            <span className="nav-badge">{counts.meetings}</span>
          )}
        </button>

        <button
          id="nav-actions-btn"
          className={`nav-item ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <div className="nav-item-content">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="nav-text">Action Items</span>
          </div>
          {counts?.actions > 0 && (
            <span className="nav-badge">{counts.actions}</span>
          )}
        </button>
      </nav>

      {/* Accountability Health Score Widget */}
      <div className="sidebar-accountability-card">
        <div className="card-mini-header">
          <span className="card-mini-title">Accountability Rate</span>
          <span className="card-mini-score">{accountabilityScore}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${accountabilityScore}%` }}></div>
        </div>
        <div className="card-mini-desc">
          {counts?.actions || 0} commitments tracked
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">LA</div>
        <div className="user-info">
          <span className="user-name">Lalit</span>
          <span className="user-role">Enterprise Admin</span>
        </div>
      </div>
    </aside>
  );
}
