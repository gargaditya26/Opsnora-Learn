function doGet(e) {
  if (e && e.parameter && e.parameter.api === 'health') {
    return jsonResponse_({ok:true,name:'OPSNORA LEARN API',time:now_().toISOString()});
  }
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('OPSNORA LEARN').addMetaTag('viewport','width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const body = parseApiBody_(e), action = clean_(body.action, 60), payload = body.payload || {};
    const routes = {
      login: function() { return login(payload.studentId, payload.pin); },
      logout: function() { return logout(payload.token); },
      studentDashboard: function() { return getStudentDashboard(payload.token); },
      learningCatalog: function() { return getLearningCatalog(payload.token); },
      nextQuestion: function() { return getNextQuestion(payload.token); },
      practiceQuestion: function() { return getPracticeQuestion(payload.token, payload.topic); },
      submitAnswer: function() { return submitAnswer(payload.token, payload.questionId, payload.selectedAnswer, payload.responseTimeSeconds); },
      startQuiz: function() { return startQuiz(payload.token, payload.topic, payload.quizNumber); },
      submitQuizAnswer: function() { return submitQuizAnswer(payload.token, payload.runId, payload.questionId, payload.selectedAnswer, payload.responseTimeSeconds); },
      quizResult: function() { return getQuizResult(payload.token, payload.runId); },
      studentAssignments: function() { return getStudentAssignments(payload.token); },
      openAssignment: function() { return openAssignment(payload.token, payload.assignmentId); },
      saveAssignment: function() { return saveAssignmentProgress(payload.token, payload.assignmentId, payload.htmlCode, payload.cssCode); },
      submitAssignment: function() { return submitAssignment(payload.token, payload.assignmentId, payload.htmlCode, payload.cssCode); },
      adminDashboard: function() { return getAdminDashboard(payload.token); },
      studentDetail: function() { return getStudentDetail(payload.token, payload.studentId); },
      awardManualXp: function() { return awardManualXp(payload.token, payload.studentId, payload.activityType, payload.description, payload.amount); },
      addQuestion: function() { return addQuestion(payload.token, payload.form || {}); },
      adminAssignments: function() { return getAdminAssignments(payload.token); },
      adminSaveAssignment: function() { return adminSaveAssignment(payload.token, payload.form || {}); },
      adminSubmission: function() { return getAdminSubmission(payload.token, payload.submissionId); },
      adminReviewAssignment: function() { return reviewAssignmentSubmission(payload.token, payload.submissionId, payload.decision, payload.remarks); }
    };
    if (!Object.prototype.hasOwnProperty.call(routes, action)) throw new Error('Unknown API action.');
    return jsonResponse_(routes[action]());
  } catch (error) {
    return jsonResponse_(publicError_(error));
  }
}

function parseApiBody_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('A JSON request body is required.');
  if (e.postData.contents.length > 250000) throw new Error('Request is too large.');
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (error) { throw new Error('Invalid JSON request.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid API request.');
  return body;
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(clientSafe_(value))).setMimeType(ContentService.MimeType.JSON);
}

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function healthCheck() { return {ok:true,name:'OPSNORA LEARN',time:now_().toISOString()}; }
