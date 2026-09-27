function getNextQuestion(token) {
  try { const user=requireSession_(token,'STUDENT'); return {ok:true, question:nextQuestion_(user)}; } catch(e){ return publicError_(e); }
}
function nextQuestion_(user) {
  const done=new Set(rows_('Progress').filter(x=>x.StudentID===user.StudentID && x.Status==='Completed').map(x=>x.QuestionID));
  const all=rows_('Questions').filter(q=>String(q.Status).toLowerCase()==='active');
  const q=all.find(x=>!done.has(x.QuestionID)); if(!q) return null;
  return {id:q.QuestionID,number:all.indexOf(q)+1,total:all.length,topic:q.Topic,subTopic:q.SubTopic,difficulty:q.Difficulty,text:q.Question,options:{A:q.OptionA,B:q.OptionB,C:q.OptionC,D:q.OptionD},xp:asNumber_(q.XP)};
}
function submitAnswer(token, questionId, selectedAnswer, responseTimeSeconds) {
  try { return withLock_(()=>{
    const user=requireSession_(token,'STUDENT'), q=rows_('Questions').find(x=>x.QuestionID===clean_(questionId,50) && String(x.Status).toLowerCase()==='active');
    if(!q) throw new Error('Question is no longer available.'); const selected=clean_(selectedAnswer,1).toUpperCase(); if(!['A','B','C','D'].includes(selected)) throw new Error('Choose an answer first.');
    let progress=rows_('Progress').find(x=>x.StudentID===user.StudentID && x.QuestionID===q.QuestionID);
    if(progress && progress.Status==='Completed') return {ok:true,duplicate:true,correct:String(q.CorrectAnswer).toUpperCase()===selected,correctAnswer:String(q.CorrectAnswer).toUpperCase(),explanation:q.Explanation,xpEarned:0,badges:[]};
    const previous=rows_('Attempts').filter(x=>x.StudentID===user.StudentID && x.QuestionID===q.QuestionID), attemptNo=previous.length+1, correct=String(q.CorrectAnswer).toUpperCase()===selected;
    let xp=0; if(correct && attemptNo===1) xp=awardXp_(user,'Quiz',q.QuestionID,'Correct '+q.Topic+' question',asNumber_(q.XP),'System');
    append_('Attempts',{AttemptID:id_('AT'),Timestamp:now_(),StudentID:user.StudentID,QuestionID:q.QuestionID,Topic:q.Topic,SelectedAnswer:selected,CorrectAnswer:String(q.CorrectAnswer).toUpperCase(),IsCorrect:correct,AttemptNumber:attemptNo,XPEarned:xp,ResponseTimeSeconds:Math.max(0,Math.min(3600,asNumber_(responseTimeSeconds)))});
    if(progress) updateRow_('Progress',progress._row,{Status:'Completed',AttemptsCount:attemptNo,XPEarned:xp,CompletedDate:now_()});
    else append_('Progress',{StudentID:user.StudentID,QuestionID:q.QuestionID,Status:'Completed',FirstAttemptCorrect:correct&&attemptNo===1,AttemptsCount:attemptNo,XPEarned:xp,CompletedDate:now_()});
    updateStreak_(user); const attempted=asNumber_(user.TotalAttempted)+1, right=asNumber_(user.CorrectAnswers)+(correct?1:0), wrong=asNumber_(user.WrongAnswers)+(correct?0:1);
    updateRow_('Students',user._row,{TotalAttempted:attempted,CorrectAnswers:right,WrongAnswers:wrong,CurrentQuestion:attempted+1}); user.TotalAttempted=attempted; user.CorrectAnswers=right; user.WrongAnswers=wrong;
    const fresh=findStudent_(user.StudentID), badges=checkBadges_(fresh);
    return {ok:true,correct:correct,correctAnswer:String(q.CorrectAnswer).toUpperCase(),correctText:q['Option'+String(q.CorrectAnswer).toUpperCase()],explanation:q.Explanation,xpEarned:xp,badges:badges};
  }); } catch(e){ return publicError_(e); }
}
