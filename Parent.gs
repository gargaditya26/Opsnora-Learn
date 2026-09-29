function getParentDashboard(token, requestedStudentId) {
  try {
    const parent=requireSession_(token,'PARENT'), parentId=String(parent.ParentID);
    const links=rows_('Parent_Students').filter(x=>String(x.ParentID)===parentId&&String(x.Status).toLowerCase()==='active');
    if(!links.length)throw new Error('No student is linked to this parent account.');
    const allowed=new Set(links.map(x=>String(x.StudentID))), requested=clean_(requestedStudentId,60), studentId=requested||String(links[0].StudentID);
    if(!allowed.has(studentId))throw new Error('You are not authorized to view this student.');
    const student=findStudent_(studentId);
    if(!student||String(student.Status).toLowerCase()!=='active'||String(student.Role||'STUDENT')!=='STUDENT')throw new Error('Linked student account is unavailable.');

    const base=studentDashboard_(student), questionMap=rows_('Questions').reduce((m,q)=>(m[String(q.QuestionID)]=q,m),{});
    const attempts=rows_('Attempts').filter(x=>String(x.StudentID)===studentId).slice(-100).reverse().map(a=>{
      const q=questionMap[String(a.QuestionID)]||{}, selected=String(a.SelectedAnswer||'').toUpperCase(), correct=String(a.CorrectAnswer||q.CorrectAnswer||'').toUpperCase();
      return {id:a.AttemptID,date:a.Timestamp,questionId:a.QuestionID,question:q.Question||'Question unavailable',topic:a.Topic||q.Topic||'',selectedAnswer:selected,selectedText:answerText_(q,selected),correctAnswer:correct,correctText:answerText_(q,correct),isCorrect:a.IsCorrect===true||String(a.IsCorrect).toLowerCase()==='true',explanation:q.Explanation||'',xp:asNumber_(a.XPEarned),responseTime:asNumber_(a.ResponseTimeSeconds)};
    });
    const quizRuns=rows_('Quiz_Runs').filter(x=>String(x.StudentID)===studentId&&String(x.Status)==='Completed').slice(-20).reverse().map(r=>({id:r.RunID,topic:r.Topic,quizNumber:asNumber_(r.QuizNumber),score:asNumber_(r.Score),total:asNumber_(r.TotalQuestions),correct:asNumber_(r.CorrectAnswers),wrong:asNumber_(r.WrongAnswers),xp:asNumber_(r.XPEarned),completedAt:r.CompletedAt}));
    const assignmentMap=rows_('Assignments').reduce((m,a)=>(m[String(a.AssignmentID)]=a,m),{});
    const assignments=rows_('Assignment_Submissions').filter(x=>String(x.StudentID)===studentId).slice().reverse().map(s=>({id:s.AssignmentID,title:(assignmentMap[String(s.AssignmentID)]||{}).Title||s.AssignmentID,topic:(assignmentMap[String(s.AssignmentID)]||{}).Topic||'',status:s.Status,lastSavedAt:s.LastSavedAt,submittedAt:s.SubmittedAt,reviewedAt:s.ReviewedAt,xpAwarded:asNumber_(s.XPAwarded),teacherRemarks:s.TeacherRemarks||''}));
    const children=links.map(link=>{const child=findStudent_(link.StudentID);return child?{id:child.StudentID,name:child.StudentName,className:child.Class,relationship:link.Relationship||'Parent/Guardian'}:null}).filter(Boolean);
    return {ok:true,data:clientSafe_({parent:{id:parent.ParentID,name:parent.ParentName},children:children,selectedStudentId:studentId,student:{profile:base.profile,stats:base.stats,level:base.level,badges:base.badges,topics:base.topics,recent:base.recent,lastActive:student.LastActiveDate||null},attempts:attempts,quizRuns:quizRuns,assignments:assignments})};
  } catch(error){return publicError_(error);}
}

function answerText_(question, answer) {
  return ['A','B','C','D'].includes(answer)?String(question['Option'+answer]||''):'';
}

function getAdminParents(token) {
  try {
    requireSession_(token,'ADMIN');
    const links=rows_('Parent_Students'), students=rows_('Students').filter(s=>String(s.Role||'STUDENT')==='STUDENT').map(s=>({id:s.StudentID,name:s.StudentName,className:s.Class,status:s.Status}));
    const parents=rows_('Parents').map(p=>({id:p.ParentID,name:p.ParentName,status:p.Status,joinDate:p.JoinDate,children:links.filter(l=>String(l.ParentID)===String(p.ParentID)&&String(l.Status).toLowerCase()==='active').map(l=>{const s=findStudent_(l.StudentID);return {id:l.StudentID,name:s?s.StudentName:l.StudentID,className:s?s.Class:'',relationship:l.Relationship||'Parent/Guardian'};})}));
    return {ok:true,data:clientSafe_({parents:parents,students:students})};
  } catch(error){return publicError_(error);}
}

function adminSaveParent(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const parentId=clean_(form.parentId,40), name=clean_(form.parentName,80), studentId=clean_(form.studentId,60), relationship=clean_(form.relationship,40)||'Parent/Guardian', pin=String(form.pin||'');
    if(!/^[A-Za-z0-9._-]{4,40}$/.test(parentId))throw new Error('Use a valid parent ID with at least 4 characters.');
    if(!name)throw new Error('Parent name is required.');
    const student=findStudent_(studentId);
    if(!student||String(student.Role||'STUDENT')!=='STUDENT')throw new Error('Student not found.');
    if(findStudent_(parentId))throw new Error('That ID is already used by a student or administrator.');
    let parent=findParent_(parentId), created=false;
    if(!parent){
      if(pin.length<6)throw new Error('A new parent PIN must contain at least 6 characters.');
      append_('Parents',{ParentID:parentId,ParentName:name,PINHash:hash_(pin),JoinDate:now_(),Status:'Active'}); created=true;
    } else {
      const changes={ParentName:name,Status:'Active'};
      if(pin){if(pin.length<6)throw new Error('Parent PIN must contain at least 6 characters.');changes.PINHash=hash_(pin);}
      updateRow_('Parents',parent._row,changes);
      if(pin)revokeSessions_(parentId);
    }
    const existing=rows_('Parent_Students').find(x=>String(x.ParentID)===parentId&&String(x.StudentID)===String(student.StudentID));
    if(existing)updateRow_('Parent_Students',existing._row,{Relationship:relationship,Status:'Active'});
    else append_('Parent_Students',{ParentID:parentId,StudentID:student.StudentID,Relationship:relationship,LinkedAt:now_(),Status:'Active'});
    return {ok:true,parentId:parentId,studentId:student.StudentID,created:created};
  }); } catch(error){return publicError_(error);}
}
