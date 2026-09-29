function getNextQuestion(token) {
  try { const user=requireSession_(token,'STUDENT'); return {ok:true, question:nextQuestion_(user)}; } catch(e){ return publicError_(e); }
}
function nextQuestion_(user) {
  const done=new Set(rows_('Progress').filter(x=>x.StudentID===user.StudentID && x.Status==='Completed').map(x=>x.QuestionID));
  const all=activeQuestions_();
  const q=all.find(x=>!done.has(x.QuestionID)); if(!q) return null;
  return {id:q.QuestionID,number:all.indexOf(q)+1,total:all.length,topic:q.Topic,subTopic:q.SubTopic,difficulty:q.Difficulty,text:q.Question,options:{A:q.OptionA,B:q.OptionB,C:q.OptionC,D:q.OptionD},xp:asNumber_(q.XP)};
}

function getPracticeQuestion(token, topic) {
  try {
    const user=requireSession_(token,'STUDENT'), requested=clean_(topic,80);
    const questions=activeQuestions_().filter(q=>String(q.Topic).toLowerCase()===requested.toLowerCase());
    if(!questions.length) throw new Error('No active questions are available for this topic.');
    const completed=new Set(rows_('Progress').filter(x=>x.StudentID===user.StudentID&&x.Status==='Completed').map(x=>x.QuestionID));
    const q=questions.find(x=>!completed.has(x.QuestionID));
    return {ok:true,question:q?publicQuestion_(q,questions.indexOf(q)+1,questions.length):null,topic:questions[0].Topic};
  } catch(e){return publicError_(e);}
}

function getLearningCatalog(token) {
  try {
    const user=requireSession_(token,'STUDENT'), questions=activeQuestions_(), progress=rows_('Progress').filter(x=>x.StudentID===user.StudentID&&x.Status==='Completed'), completed=new Set(progress.map(x=>x.QuestionID));
    const runs=rows_('Quiz_Runs').filter(x=>x.StudentID===user.StudentID&&x.Status==='Completed'), grouped={};
    questions.forEach(q=>{ const key=String(q.Topic); if(!grouped[key])grouped[key]=[]; grouped[key].push(q); });
    const topics=Object.keys(grouped).sort().map(topic=>{
      const list=grouped[topic], quizzes=[];
      for(let start=0,number=1;start<list.length;start+=10,number++){
        const chunk=list.slice(start,start+10), matching=runs.filter(r=>String(r.Topic)===topic&&asNumber_(r.QuizNumber)===number), best=matching.reduce((max,r)=>Math.max(max,asNumber_(r.Score)),0);
        quizzes.push({number:number,name:topic+' Quiz '+number,count:chunk.length,range:(start+1)+'–'+(start+chunk.length),attempted:matching.length>0,bestScore:best,bestPercent:matching.length?Math.round(best/chunk.length*100):null});
      }
      return {name:topic,total:list.length,completed:list.filter(q=>completed.has(q.QuestionID)).length,quizzes:quizzes};
    });
    return {ok:true,data:{topics:topics}};
  } catch(e){return publicError_(e);}
}

function startQuiz(token, topic, quizNumber) {
  try { return withLock_(()=>{
    const user=requireSession_(token,'STUDENT'), requested=clean_(topic,80), number=Math.max(1,Math.floor(asNumber_(quizNumber,1)));
    const topicQuestions=activeQuestions_().filter(q=>String(q.Topic).toLowerCase()===requested.toLowerCase()), questions=topicQuestions.slice((number-1)*10,number*10);
    if(!questions.length) throw new Error('This quiz is not available.');
    const runId=id_('QR');
    append_('Quiz_Runs',{RunID:runId,StudentID:user.StudentID,Topic:questions[0].Topic,QuizNumber:number,QuestionIDs:questions.map(q=>q.QuestionID).join(','),StartedAt:now_(),Score:0,TotalQuestions:questions.length,CorrectAnswers:0,WrongAnswers:0,XPEarned:0,Status:'InProgress'});
    return {ok:true,run:{id:runId,name:questions[0].Topic+' Quiz '+number,topic:questions[0].Topic,number:number,total:questions.length,current:1,question:publicQuestion_(questions[0],1,questions.length)}};
  }); } catch(e){return publicError_(e);}
}

function submitQuizAnswer(token, runId, questionId, selectedAnswer, responseTimeSeconds) {
  try { return withLock_(()=>{
    const user=requireSession_(token,'STUDENT'), run=rows_('Quiz_Runs').find(x=>x.RunID===clean_(runId,60)&&x.StudentID===user.StudentID);
    if(!run||run.Status!=='InProgress') throw new Error('This quiz run is no longer active.');
    const ids=String(run.QuestionIDs).split(',').filter(Boolean), answers=rows_('Quiz_Run_Answers').filter(x=>x.RunID===run.RunID);
    if(answers.length>=ids.length) throw new Error('This quiz is already complete.');
    const expectedId=ids[answers.length]; if(clean_(questionId,60)!==expectedId) throw new Error('Unexpected quiz question.');
    const q=activeQuestions_().find(x=>x.QuestionID===expectedId); if(!q) throw new Error('Question is no longer active.');
    const selected=clean_(selectedAnswer,1).toUpperCase(); if(!['A','B','C','D'].includes(selected)) throw new Error('Choose an answer first.');
    const correct=String(q.CorrectAnswer).toUpperCase()===selected, previous=rows_('Attempts').filter(x=>x.StudentID===user.StudentID&&x.QuestionID===q.QuestionID), attemptNo=previous.length+1;
    let xp=0; if(correct&&attemptNo===1)xp=awardXp_(user,'Quiz',q.QuestionID,'Correct '+q.Topic+' question',asNumber_(q.XP),'System');
    append_('Attempts',{AttemptID:id_('AT'),Timestamp:now_(),StudentID:user.StudentID,QuestionID:q.QuestionID,Topic:q.Topic,SelectedAnswer:selected,CorrectAnswer:String(q.CorrectAnswer).toUpperCase(),IsCorrect:correct,AttemptNumber:attemptNo,XPEarned:xp,ResponseTimeSeconds:Math.max(0,Math.min(3600,asNumber_(responseTimeSeconds)))});
    append_('Quiz_Run_Answers',{RunID:run.RunID,StudentID:user.StudentID,QuestionID:q.QuestionID,QuestionNumber:answers.length+1,Question:q.Question,SelectedAnswer:selected,SelectedText:q['Option'+selected],CorrectAnswer:String(q.CorrectAnswer).toUpperCase(),CorrectText:q['Option'+String(q.CorrectAnswer).toUpperCase()],Explanation:q.Explanation,IsCorrect:correct,XPEarned:xp,ResponseTimeSeconds:Math.max(0,Math.min(3600,asNumber_(responseTimeSeconds))),AnsweredAt:now_()});
    let progress=rows_('Progress').find(x=>x.StudentID===user.StudentID&&x.QuestionID===q.QuestionID);
    if(!progress)append_('Progress',{StudentID:user.StudentID,QuestionID:q.QuestionID,Status:'Completed',FirstAttemptCorrect:correct&&attemptNo===1,AttemptsCount:attemptNo,XPEarned:xp,CompletedDate:now_()});
    else if(progress.Status!=='Completed')updateRow_('Progress',progress._row,{Status:'Completed',AttemptsCount:attemptNo,XPEarned:xp,CompletedDate:now_()});
    updateStreak_(user); const attempted=asNumber_(user.TotalAttempted)+1,right=asNumber_(user.CorrectAnswers)+(correct?1:0),wrong=asNumber_(user.WrongAnswers)+(correct?0:1);
    updateRow_('Students',user._row,{TotalAttempted:attempted,CorrectAnswers:right,WrongAnswers:wrong,CurrentQuestion:attempted+1});
    const allAnswers=answers.concat([{IsCorrect:correct,XPEarned:xp}]), complete=allAnswers.length===ids.length;
    if(complete){
      const correctCount=allAnswers.filter(a=>a.IsCorrect===true||String(a.IsCorrect).toLowerCase()==='true').length,totalXp=allAnswers.reduce((n,a)=>n+asNumber_(a.XPEarned),0);
      updateRow_('Quiz_Runs',run._row,{CompletedAt:now_(),Score:correctCount,CorrectAnswers:correctCount,WrongAnswers:ids.length-correctCount,XPEarned:totalXp,Status:'Completed'});
      const fresh=findStudent_(user.StudentID),badges=checkBadges_(fresh); safeLearningEvent_(fresh.StudentID,'QUESTION',{topic:q.Topic,badges:badges}); return {ok:true,complete:true,result:quizResult_(fresh,run.RunID),badges:badges};
    }
    const nextId=ids[allAnswers.length],next=activeQuestions_().find(x=>x.QuestionID===nextId);
    return {ok:true,complete:false,current:allAnswers.length+1,total:ids.length,question:publicQuestion_(next,allAnswers.length+1,ids.length)};
  }); } catch(e){return publicError_(e);}
}

function getQuizResult(token, runId) {
  try { const user=requireSession_(token,'STUDENT'); return {ok:true,result:quizResult_(user,clean_(runId,60))}; } catch(e){return publicError_(e);}
}

function quizResult_(user, runId) {
  const run=rows_('Quiz_Runs').find(x=>x.RunID===runId&&x.StudentID===user.StudentID); if(!run||run.Status!=='Completed')throw new Error('Completed quiz result not found.');
  const questionMap=activeQuestions_().reduce((map,q)=>(map[q.QuestionID]=q,map),{}),answers=rows_('Quiz_Run_Answers').filter(x=>x.RunID===run.RunID).sort((a,b)=>asNumber_(a.QuestionNumber)-asNumber_(b.QuestionNumber));
  return {runId:run.RunID,name:run.Topic+' Quiz '+run.QuizNumber,topic:run.Topic,quizNumber:asNumber_(run.QuizNumber),score:asNumber_(run.Score),total:asNumber_(run.TotalQuestions),percent:Math.round(asNumber_(run.Score)/Math.max(1,asNumber_(run.TotalQuestions))*100),correct:asNumber_(run.CorrectAnswers),wrong:asNumber_(run.WrongAnswers),xpEarned:asNumber_(run.XPEarned),review:answers.map(a=>{const q=questionMap[a.QuestionID]||{};return {number:asNumber_(a.QuestionNumber),question:a.Question||q.Question||a.QuestionID,selectedAnswer:a.SelectedAnswer,selectedText:a.SelectedText||q['Option'+a.SelectedAnswer]||'',correctAnswer:a.CorrectAnswer,correctText:a.CorrectText||q['Option'+a.CorrectAnswer]||'',correct:a.IsCorrect===true||String(a.IsCorrect).toLowerCase()==='true',explanation:a.Explanation||q.Explanation||''};})};
}

function publicQuestion_(q, number, total) {
  return {id:q.QuestionID,number:number,total:total,topic:q.Topic,subTopic:q.SubTopic,difficulty:q.Difficulty,text:q.Question,options:{A:q.OptionA,B:q.OptionB,C:q.OptionC,D:q.OptionD},xp:asNumber_(q.XP)};
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
    const fresh=findStudent_(user.StudentID), badges=checkBadges_(fresh); safeLearningEvent_(fresh.StudentID,'QUESTION',{topic:q.Topic,badges:badges});
    return {ok:true,correct:correct,correctAnswer:String(q.CorrectAnswer).toUpperCase(),correctText:q['Option'+String(q.CorrectAnswer).toUpperCase()],explanation:q.Explanation,xpEarned:xp,badges:badges};
  }); } catch(e){ return publicError_(e); }
}
