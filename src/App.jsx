import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TranscriptInput from './components/TranscriptInput';
import ActionTable from './components/ActionTable';
import AuditTrail from './components/AuditTrail';
import {
  fetchMeetings,
  fetchActionItems,
  processMeetingApi,
  updateActionItemStatusApi
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [selectedActionItem, setSelectedActionItem] = useState(null);
  const [initialStatusFilter, setInitialStatusFilter] = useState('ALL');
  const [toast, setToast] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Show a momentary toast notification
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load live data from SQLite backend on initial render
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [loadedMeetings, loadedActions] = await Promise.all([
          fetchMeetings(),
          fetchActionItems()
        ]);
        setMeetings(loadedMeetings);
        setActionItems(loadedActions);
        setDbConnected(true);
      } catch (err) {
        console.error('Error loading data from SQLite backend:', err);
        setDbConnected(false);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handler for processing new meeting and extracted action items via FastAPI / SQLite
  const handleProcessMeeting = async (meetingPayload) => {
    try {
      const result = await processMeetingApi(meetingPayload);
      if (result && result.meeting && result.actionItems) {
        setMeetings(prev => [result.meeting, ...prev]);
        setActionItems(prev => [...result.actionItems, ...prev]);
        showToast(`Processed "${result.meeting.title}" with ${result.actionItems.length} action items saved to SQLite!`);
        return result;
      }
    } catch (err) {
      console.error('Failed to process meeting:', err);
      showToast('Error saving meeting to backend.');
      throw err;
    }
  };

  // Handler for updating status of an action item via FastAPI / SQLite
  const handleUpdateStatus = async (actionId, newStatus) => {
    // Optimistic UI update
    setActionItems(prev =>
      prev.map(item =>
        item.id === actionId ? { ...item, status: newStatus } : item
      )
    );
    if (selectedActionItem && selectedActionItem.id === actionId) {
      setSelectedActionItem(prev => ({ ...prev, status: newStatus }));
    }

    try {
      await updateActionItemStatusApi(actionId, newStatus);
      showToast(`Status updated to "${newStatus}" in SQLite database`);
    } catch (err) {
      console.error('Error updating status in SQLite backend:', err);
      showToast('Error updating status in database.');
    }
  };

  // Handler for jumping to ActionTable with a pre-selected filter from Dashboard
  const handleFilterByStatus = (status) => {
    setInitialStatusFilter(status);
    setActiveTab('actions');
  };

  // Count calculations
  const counts = {
    meetings: meetings.length,
    actions: actionItems.length
  };

  // Calculate accountability score (Completed / Total commitments)
  const completedCount = actionItems.filter(i => i.status === 'COMPLETED').length;
  const overdueCount = actionItems.filter(i => i.status === 'OVERDUE').length;
  const totalCount = actionItems.length;
  const accountabilityScore = totalCount > 0
    ? Math.round(((completedCount + (totalCount - overdueCount - completedCount) * 0.7) / totalCount) * 100)
    : 100;

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        accountabilityScore={accountabilityScore}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="top-navbar-title">
            <h1>AI Meeting-to-Accountability System</h1>
            <span className="top-navbar-badge">
              <span className="pulse-dot"></span>
              {dbConnected ? 'SQLite Connected (FastAPI)' : 'Connecting Backend...'}
            </span>
          </div>

          <div className="top-navbar-actions">
            <button
              id="top-quick-meeting-btn"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('meetings')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Meeting
            </button>
          </div>
        </header>

        {/* Dynamic View Sections */}
        <div className="content-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              meetings={meetings}
              actionItems={actionItems}
              onSelectAction={setSelectedActionItem}
              onNavigate={setActiveTab}
              onFilterByStatus={handleFilterByStatus}
            />
          )}

          {activeTab === 'meetings' && (
            <TranscriptInput
              meetings={meetings}
              onProcessMeeting={handleProcessMeeting}
              onSelectMeetingTranscript={() => {}}
              onSelectAction={setSelectedActionItem}
            />
          )}

          {activeTab === 'actions' && (
            <ActionTable
              actionItems={actionItems}
              onSelectAction={setSelectedActionItem}
              onUpdateStatus={handleUpdateStatus}
              initialStatusFilter={initialStatusFilter}
            />
          )}
        </div>
      </main>

      {/* Audit Trail Modal */}
      {selectedActionItem && (
        <AuditTrail
          actionItem={selectedActionItem}
          onClose={() => setSelectedActionItem(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
