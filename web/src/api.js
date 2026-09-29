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
  learningCatalog: () => call('learningCatalog',withToken()),
  nextQuestion: () => call('nextQuestion',withToken()),
  practiceQuestion: topic => call('practiceQuestion',withToken({topic})),
  submitAnswer: (questionId,selectedAnswer,responseTimeSeconds) => call('submitAnswer',withToken({questionId,selectedAnswer,responseTimeSeconds})),
  startQuiz: (topic,quizNumber) => call('startQuiz',withToken({topic,quizNumber})),
  submitQuizAnswer: (runId,questionId,selectedAnswer,responseTimeSeconds) => call('submitQuizAnswer',withToken({runId,questionId,selectedAnswer,responseTimeSeconds})),
  quizResult: runId => call('quizResult',withToken({runId})),
  studentAssignments: () => call('studentAssignments',withToken()),
  openAssignment: assignmentId => call('openAssignment',withToken({assignmentId})),
  saveAssignment: (assignmentId,htmlCode,cssCode) => call('saveAssignment',withToken({assignmentId,htmlCode,cssCode})),
  submitAssignment: (assignmentId,htmlCode,cssCode) => call('submitAssignment',withToken({assignmentId,htmlCode,cssCode})),
  adminDashboard: () => call('adminDashboard',withToken()),
  studentDetail: studentId => call('studentDetail',withToken({studentId})),
  awardManualXp: data => call('awardManualXp',withToken(data)),
  addQuestion: form => call('addQuestion',withToken({form})),
  adminAssignments: () => call('adminAssignments',withToken()),
  adminSaveAssignment: form => call('adminSaveAssignment',withToken({form})),
  adminSubmission: submissionId => call('adminSubmission',withToken({submissionId})),
  adminReviewAssignment: (submissionId,decision,remarks) => call('adminReviewAssignment',withToken({submissionId,decision,remarks})),
  adminResetStudentProgress: studentId => call('adminResetStudentProgress',withToken({studentId})),
  parentDashboard: studentId => call('parentDashboard',withToken({studentId})),
  changeParentPin: (currentPin,newPin,confirmPin) => call('changeParentPin',withToken({currentPin,newPin,confirmPin})),
  adminParents: () => call('adminParents',withToken()),
  adminSaveParent: form => call('adminSaveParent',withToken({form})),
  adminParentOperations: () => call('adminParentOperations',withToken()),
  adminSaveLearningSession: form => call('adminSaveLearningSession',withToken({form})),
  adminSavePlan: form => call('adminSavePlan',withToken({form})),
  adminSaveSubscription: form => call('adminSaveSubscription',withToken({form})),
  adminSaveInvoice: form => call('adminSaveInvoice',withToken({form})),
  adminRecordPayment: form => call('adminRecordPayment',withToken({form}))
};
