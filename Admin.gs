function getAdminDashboard(token) {
  try { requireSession_(token,'ADMIN'); const students=rows_('Students').filter(s=>(s.Role||'STUDENT')==='STUDENT'), activeQ=activeQuestions_(), attempts=rows_('Attempts');
    return {ok:true,data:clientSafe_({totals:{students:students.length,activeStudents:students.filter(s=>String(s.Status).toLowerCase()==='active').length,questions:activeQ.length,attempts:attempts.length},students:students.map(s=>adminStudentSummary_(s))})};
  } catch(e){ return publicError_(e); }
}
function adminStudentSummary_(s){ const p=rows_('Progress').filter(x=>x.StudentID===s.StudentID&&x.Status==='Completed'), a=rows_('Attempts').filter(x=>x.StudentID===s.StudentID), c=a.filter(x=>x.IsCorrect===true||String(x.IsCorrect).toLowerCase()==='true').length; return {id:s.StudentID,name:s.StudentName,className:s.Class,xp:asNumber_(s.TotalXP),level:asNumber_(s.Level),completed:p.length,total:activeQuestions_().length,accuracy:a.length?Math.round(c/a.length*100):0,streak:asNumber_(s.CurrentStreak),lastActive:s.LastActiveDate||null,status:s.Status}; }
function getStudentDetail(token, studentId) {
  try { requireSession_(token,'ADMIN'); const s=findStudent_(studentId); if(!s||(s.Role||'STUDENT')!=='STUDENT') throw new Error('Student not found.'); const base=studentDashboard_(s), attempts=rows_('Attempts').filter(x=>x.StudentID===s.StudentID).slice(-20).reverse(), xp=rows_('XP_Log').filter(x=>x.StudentID===s.StudentID).slice(-30).reverse(); return {ok:true,data:clientSafe_(Object.assign(base,{attempts:attempts,xpHistory:xp,longestStreak:asNumber_(s.LongestStreak)}))}; } catch(e){return publicError_(e);}
}
function awardManualXp(token, studentId, activityType, description, amount) {
  try { return withLock_(()=>{ const admin=requireSession_(token,'ADMIN'), student=findStudent_(studentId), n=Math.round(asNumber_(amount)); if(!student) throw new Error('Student not found.'); if(!['Offline Class Task','Assignment','Project','Bonus','Other'].includes(activityType)) throw new Error('Invalid activity type.'); if(n<1||n>10000) throw new Error('XP must be between 1 and 10,000.'); if(!clean_(description,200)) throw new Error('Description is required.'); const ref=id_('MAN'); awardXp_(student,'Manual',ref,activityType+': '+clean_(description,200),n,admin.StudentID); const fresh=findStudent_(studentId), badges=checkBadges_(fresh); return {ok:true,xp:asNumber_(fresh.TotalXP),level:asNumber_(fresh.Level),badges:badges}; }); } catch(e){return publicError_(e);}
}
function addQuestion(token, form) {
  try { requireSession_(token,'ADMIN'); const answer=clean_(form.correctAnswer,1).toUpperCase(); if(!['A','B','C','D'].includes(answer)) throw new Error('Correct answer must be A, B, C, or D.'); const required=['topic','question','optionA','optionB','optionC','optionD','explanation']; required.forEach(k=>{if(!clean_(form[k],1000)) throw new Error('Complete every required field.');}); const existing=rows_('Questions'), numeric=existing.map(q=>Number(String(q.QuestionID).replace(/\D/g,''))||0), id='Q'+String(Math.max(0,...numeric)+1).padStart(3,'0'); append_('Questions',{QuestionID:id,Topic:clean_(form.topic,80),SubTopic:clean_(form.subTopic,80),Difficulty:clean_(form.difficulty,30)||'Beginner',Question:clean_(form.question,1000),OptionA:clean_(form.optionA,500),OptionB:clean_(form.optionB,500),OptionC:clean_(form.optionC,500),OptionD:clean_(form.optionD,500),CorrectAnswer:answer,Explanation:clean_(form.explanation,1000),XP:Math.max(1,Math.min(100,asNumber_(form.xp,10))),Status:'Active'}); clearQuestionCache_(); return {ok:true,id:id}; } catch(e){return publicError_(e);}
}

function resetStudentProgress(token, studentId) {
  try { return withLock_(function() {
    requireSession_(token,'ADMIN');
    const student=findStudent_(studentId);
    if(!student)throw new Error('Student not found.');
    if(String(student.Role||'STUDENT').toUpperCase()==='ADMIN')throw new Error('Administrator accounts cannot be reset.');
    const id=String(student.StudentID), runIds=new Set(rows_('Quiz_Runs').filter(r=>r.StudentID===id).map(r=>r.RunID));
    const counts={
      attemptsDeleted:deleteRowsMatching_('Attempts',r=>r.StudentID===id),
      progressDeleted:deleteRowsMatching_('Progress',r=>r.StudentID===id),
      xpLogsDeleted:deleteRowsMatching_('XP_Log',r=>r.StudentID===id),
      badgesDeleted:deleteRowsMatching_('Student_Badges',r=>r.StudentID===id),
      quizAnswersDeleted:deleteRowsMatching_('Quiz_Run_Answers',r=>r.StudentID===id||runIds.has(r.RunID)),
      quizRunsDeleted:deleteRowsMatching_('Quiz_Runs',r=>r.StudentID===id),
      assignmentSubmissionsDeleted:deleteRowsMatching_('Assignment_Submissions',r=>r.StudentID===id)
    };
    updateRow_('Students',student._row,{TotalXP:0,Level:1,CurrentQuestion:1,TotalAttempted:0,CorrectAnswers:0,WrongAnswers:0,CurrentStreak:0,LongestStreak:0,LastActiveDate:''});
    revokeSessions_(id);
    return Object.assign({ok:true,success:true,studentId:id},counts);
  }); } catch(e){return publicError_(e);}
}

function deleteRowsMatching_(sheetName, predicate) {
  const matches=rows_(sheetName).filter(predicate).map(r=>r._row).sort((a,b)=>b-a), sheet=sheet_(sheetName);
  matches.forEach(row=>sheet.deleteRow(row));
  return matches.length;
}
