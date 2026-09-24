import React, { useState } from 'react';

const STATUS_OPTIONS = ['NEW', 'CARRIED_OVER', 'OVERDUE', 'COMPLETED'];

export default function ActionTable({
  actionItems,
  onSelectAction,
  onUpdateStatus,
  initialStatusFilter = 'ALL'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatusFilter);
  const [selectedOwner, setSelectedOwner] = useState('ALL');
  const [sortBy, setSortBy] = useState('deadline-asc');

  // Extract unique owners for filter dropdown
  const uniqueOwners = Array.from(new Set(actionItems.map(item => item.owner)));

  // Status counts for filter pills & summary
  const counts = {
    ALL: actionItems.length,
    NEW: actionItems.filter(i => i.status === 'NEW').length,
    COMPLETED: actionItems.filter(i => i.status === 'COMPLETED').length,
    OVERDUE: actionItems.filter(i => i.status === 'OVERDUE').length,
    CARRIED_OVER: actionItems.filter(i => i.status === 'CARRIED OVER' || i.status === 'CARRIED_OVER').length
  };

  // Filter items
  const filteredItems = actionItems.filter(item => {
    // Status filter
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'CARRIED_OVER' || selectedStatus === 'CARRIED OVER') {
        if (item.status !== 'CARRIED OVER' && item.status !== 'CARRIED_OVER') return false;
      } else if (item.status !== selectedStatus) {
        return false;
      }
    }
    // Owner filter
    if (selectedOwner !== 'ALL' && item.owner !== selectedOwner) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = item.action.toLowerCase().includes(q);
      const matchOwner = item.owner.toLowerCase().includes(q);
      const matchMeeting = item.meetingTitle?.toLowerCase().includes(q);
      if (!matchAction && !matchOwner && !matchMeeting) return false;
    }
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'deadline-asc') {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (sortBy === 'deadline-desc') {
      return new Date(b.deadline) - new Date(a.deadline);
    }
    if (sortBy === 'owner') {
      return a.owner.localeCompare(b.owner);
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Helper for status badge / dropdown styling class
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

  return (
    <div className="action-table-section">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Action Items</h2>
          <p>Extracted commitments with direct ownership, deadlines, and live status tracking</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {sortedItems.length} of {actionItems.length} items
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {/* Toolbar: Search and Filter Pills */}
        <div className="table-toolbar">
          <div className="search-input-group">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              id="action-search-input"
              className="search-input"
              type="text"
              placeholder="Search by action, owner, or meeting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills-group">
            {['ALL', 'NEW', 'CARRIED_OVER', 'OVERDUE', 'COMPLETED'].map((st) => (
              <button
                key={st}
                id={`filter-pill-${st.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')}`}
                className={`filter-pill ${selectedStatus === st || (st === 'CARRIED_OVER' && selectedStatus === 'CARRIED OVER') ? 'active' : ''}`}
                onClick={() => setSelectedStatus(st)}
              >
                <span>{st === 'ALL' ? 'All Items' : (st === 'CARRIED_OVER' ? 'Carried Over' : st)}</span>
                <span className="filter-count">{counts[st] || 0}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Owner filter dropdown */}
            <select
              id="owner-filter-select"
              className="status-select-inline"
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              style={{ padding: '6px 10px' }}
            >
              <option value="ALL">All Owners ({uniqueOwners.length})</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>

            {/* Sort dropdown */}
            <select
              id="sort-select"
              className="status-select-inline"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '6px 10px' }}
            >
              <option value="deadline-asc">Deadline (Earliest)</option>
              <option value="deadline-desc">Deadline (Latest)</option>
              <option value="owner">Owner (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Action Items Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="enterprise-table" id="action-items-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Action</th>
                <th style={{ width: '22%' }}>Owner</th>
                <th style={{ width: '16%' }}>Deadline</th>
                <th style={{ width: '14%' }}>Status</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }}>
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    {actionItems.length === 0 ? 'No action items yet' : 'No action items match your search or filter.'}
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    id={`action-row-${item.id}`}
                    onClick={() => onSelectAction(item)}
                    title="Click to view audit details"
                  >
                    {/* 1. Action */}
                    <td className="table-action-cell">
                      <div className="action-title-text">{item.action}</div>
                      <div className="action-meeting-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        </svg>
                        <span>{item.meetingTitle}</span>
                      </div>
                    </td>

                    {/* 2. Owner */}
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

                    {/* 3. Deadline */}
                    <td>
                      <div className={`deadline-wrap ${item.status === 'OVERDUE' ? 'deadline-overdue' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>{item.deadline}</span>
                      </div>
                    </td>

                    {/* 4. Status: Status Dropdown (NEW, CARRIED_OVER, OVERDUE, COMPLETED) */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        id={`status-select-${item.id}`}
                        className={getStatusClass(item.status)}
                        value={item.status === 'CARRIED OVER' ? 'CARRIED_OVER' : item.status}
                        onChange={(e) => onUpdateStatus(item.id, e.target.value)}
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
                    </td>

                    {/* 5. Audit inspect button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        id={`btn-audit-${item.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAction(item);
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
