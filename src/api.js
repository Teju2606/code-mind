// API client connecting React frontend to FastAPI / SQLite backend

const API_BASE = 'http://127.0.0.1:8001/api';

export async function fetchMeetings() {
  const res = await fetch(`${API_BASE}/meetings`);
  if (!res.ok) {
    throw new Error(`Failed to fetch meetings: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchActionItems() {
  const res = await fetch(`${API_BASE}/action-items`);
  if (!res.ok) {
    throw new Error(`Failed to fetch action items: ${res.statusText}`);
  }
  return await res.json();
}

export async function processMeetingApi(meetingData) {
  const res = await fetch(`${API_BASE}/meetings/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(meetingData)
  });
  if (!res.ok) {
    throw new Error(`Failed to process meeting: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateActionItemStatusApi(actionId, status) {
  const res = await fetch(`${API_BASE}/action-items/${actionId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    throw new Error(`Failed to update status: ${res.statusText}`);
  }
  return await res.json();
}
