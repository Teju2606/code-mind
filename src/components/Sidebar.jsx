import React from 'react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  counts,
  accountabilityScore = 100,
  mobileOpen = false,
  onCloseMobile
}) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="brand-info">
            <div className="brand-title-row">
              <span className="brand-title">AccountaMind</span>
              <span className="brand-badge">PRO</span>
            </div>
            <span className="brand-subtitle">AI Accountability Engine</span>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              className="btn-icon sidebar-mobile-close"
              onClick={onCloseMobile}
              title="Close menu"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Core Workspace</div>

          <button
            id="nav-dashboard-btn"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="nav-item-content">
              <div className="nav-icon-wrap">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1.5" />
                  <rect width="7" height="5" x="14" y="3" rx="1.5" />
                  <rect width="7" height="9" x="14" y="12" rx="1.5" />
                  <rect width="7" height="5" x="3" y="16" rx="1.5" />
                </svg>
              </div>
              <span className="nav-text">Dashboard</span>
            </div>
            {activeTab === 'dashboard' && <span className="active-pill-glow"></span>}
          </button>

          <button
            id="nav-meetings-btn"
            className={`nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
            onClick={() => handleNavClick('meetings')}
          >
            <div className="nav-item-content">
              <div className="nav-icon-wrap">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <span className="nav-text">Meeting Intake</span>
            </div>
            {counts?.meetings > 0 ? (
              <span className="nav-badge">{counts.meetings}</span>
            ) : activeTab === 'meetings' ? (
              <span className="active-pill-glow"></span>
            ) : null}
          </button>

          <button
            id="nav-actions-btn"
            className={`nav-item ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => handleNavClick('actions')}
          >
            <div className="nav-item-content">
              <div className="nav-icon-wrap">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <span className="nav-text">Action Registry</span>
            </div>
            {counts?.actions > 0 ? (
              <span className="nav-badge">{counts.actions}</span>
            ) : activeTab === 'actions' ? (
              <span className="active-pill-glow"></span>
            ) : null}
          </button>
        </nav>

        {/* Accountability Health Score Widget */}
        <div className="sidebar-accountability-card">
          <div className="card-mini-header">
            <div className="card-mini-title-wrap">
              <span className="status-dot completed"></span>
              <span className="card-mini-title">Accountability Rate</span>
            </div>
            <span className="card-mini-score">{accountabilityScore}%</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, accountabilityScore))}%` }}
            ></div>
          </div>
          <div className="card-mini-desc">
            <span className="commitments-count-number">{counts?.actions || 0}</span> commitments tracked in SQLite
          </div>
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar-wrap">
            <div className="user-avatar">LA</div>
            <span className="user-online-dot"></span>
          </div>
          <div className="user-info">
            <span className="user-name">Lalit</span>
            <span className="user-role">Workspace Admin</span>
          </div>
        </div>
      </aside>
    </>
  );
}
