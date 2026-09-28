const ALLOWED_ACTIONS = new Set([
  'login', 'logout', 'studentDashboard', 'learningCatalog', 'nextQuestion',
  'practiceQuestion', 'submitAnswer', 'startQuiz', 'submitQuizAnswer', 'quizResult',
  'studentAssignments', 'openAssignment', 'saveAssignment', 'submitAssignment',
  'adminDashboard', 'studentDetail', 'awardManualXp', 'addQuestion'
  ,'adminAssignments', 'adminSaveAssignment', 'adminSubmission', 'adminReviewAssignment'
]);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ok:false,error:'Method not allowed.'});
  }

  const action = typeof request.body?.action === 'string' ? request.body.action : '';
  const payload = request.body?.payload;
  if (!ALLOWED_ACTIONS.has(action) || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return response.status(400).json({ok:false,error:'Invalid API request.'});
  }

  const endpoint = process.env.APPS_SCRIPT_API_URL;
  if (!endpoint) return response.status(500).json({ok:false,error:'Backend endpoint is not configured.'});

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      redirect: 'follow',
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action,payload}),
      signal: AbortSignal.timeout(25000)
    });
    const text = await upstream.text();
    let result;
    try { result = JSON.parse(text); } catch (_) { throw new Error('Backend returned an invalid response.'); }
    response.setHeader('Cache-Control','no-store');
    return response.status(upstream.ok ? 200 : 502).json(result);
  } catch (error) {
    console.error('Apps Script proxy error:', error);
    return response.status(502).json({ok:false,error:'Learning service is temporarily unavailable.'});
  }
}
