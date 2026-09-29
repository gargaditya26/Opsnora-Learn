function getDb_() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'PASTE_SPREADSHEET_ID_HERE') throw new Error('Set CONFIG.SPREADSHEET_ID in Config.gs first.');
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function sheet_(name) { const s = getDb_().getSheetByName(name); if (!s) throw new Error('Missing sheet: ' + name); return s; }
function rows_(name) {
  const s = sheet_(name), values = s.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(r => r.some(v => v !== '')).map((r, i) => {
    const o = {_row: i + 2}; headers.forEach((h, j) => o[h] = r[j]); return o;
  });
}
function append_(name, obj) { const h = CONFIG.SHEETS[name]; sheet_(name).appendRow(h.map(k => obj[k] === undefined ? '' : obj[k])); }
function updateRow_(name, row, changes) {
  const s = sheet_(name), h = CONFIG.SHEETS[name];
  Object.keys(changes).forEach(k => { const c = h.indexOf(k); if (c >= 0) s.getRange(row, c + 1).setValue(changes[k]); });
}
function id_(prefix) { return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 16); }
function now_() { return new Date(); }
function dateKey_(d) { return Utilities.formatDate(new Date(d), CONFIG.TIMEZONE, 'yyyy-MM-dd'); }
function hash_(value) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)); }
function safeEqual_(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; let n = 0; for (let i=0;i<a.length;i++) n |= a.charCodeAt(i)^b.charCodeAt(i); return n === 0; }
function clean_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 500); }
function asNumber_(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : (fallback || 0); }
function findStudent_(id) { return rows_('Students').find(x => String(x.StudentID).toLowerCase() === clean_(id, 60).toLowerCase()); }
function findParent_(id) { try { return rows_('Parents').find(x => String(x.ParentID).toLowerCase() === clean_(id, 60).toLowerCase()); } catch (error) { return null; } }
function activeQuestions_() {
  const cache = CacheService.getScriptCache(), key = 'active_questions_v1', cached = cache.get(key);
  if (cached) { try { return JSON.parse(cached); } catch (error) {} }
  const questions = rows_('Questions').filter(q => String(q.Status).toLowerCase() === 'active').sort((a,b) => String(a.QuestionID).localeCompare(String(b.QuestionID), undefined, {numeric:true}));
  const safe = clientSafe_(questions.map(q => { const copy = Object.assign({}, q); delete copy._row; return copy; }));
  try { cache.put(key, JSON.stringify(safe), 60); } catch (error) {}
  return safe;
}
function clearQuestionCache_() { CacheService.getScriptCache().remove('active_questions_v1'); }
function levelForXp_(xp) { let found = CONFIG.LEVELS[0]; CONFIG.LEVELS.forEach(x => { if (xp >= x.min) found = x; }); return found; }
function publicError_(e) { console.error(e && e.stack || e); return {ok:false, error: e && e.message ? e.message : 'Something went wrong.'}; }
function withLock_(fn) { const lock = LockService.getScriptLock(); lock.waitLock(20000); try { return fn(); } finally { lock.releaseLock(); } }
function clientSafe_(value) { return JSON.parse(JSON.stringify(value)); }
