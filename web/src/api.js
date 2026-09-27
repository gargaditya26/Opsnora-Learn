const API_PATH = '/api/backend';
const SESSION_KEY = 'opsnora_session';

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR') { super(message); this.name = 'ApiError'; this.code = code; }
}

async function call(action, payload = {}) {
  let response;
  try {
    response = await fetch(API_PATH, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({action,payload})
    });
  } catch (_) {
    throw new ApiError('Network error. Please check your internet connection.', 'NETWORK');
  }
  let result;
  try { result = await response.json(); } catch (_) { throw new ApiError('The server returned an invalid response.', 'INVALID_RESPONSE'); }
  if (!response.ok || !result.ok) {
    const message = result.error || 'Something went wrong.';
    const code = /session|sign in|expired/i.test(message) ? 'SESSION_EXPIRED' : 'API_ERROR';
    throw new ApiError(message, code);
  }
  return result;
}

export const session = {
  get() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch (_) { return null; } },
  set(value) { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); },
  clear() { localStorage.removeItem(SESSION_KEY); }
};

const withToken = payload => ({...payload,token:session.get()?.token || ''});
export const api = {
  login: (studentId,pin) => call('login',{studentId,pin}),
  logout: () => call('logout',withToken()),
  studentDashboard: () => call('studentDashboard',withToken()),
  nextQuestion: () => call('nextQuestion',withToken()),
  submitAnswer: (questionId,selectedAnswer,responseTimeSeconds) => call('submitAnswer',withToken({questionId,selectedAnswer,responseTimeSeconds})),
  adminDashboard: () => call('adminDashboard',withToken()),
  studentDetail: studentId => call('studentDetail',withToken({studentId})),
  awardManualXp: data => call('awardManualXp',withToken(data)),
  addQuestion: form => call('addQuestion',withToken({form}))
};
