function activeAssignments_() {
  return rows_('Assignments').filter(a=>String(a.Status).toLowerCase()==='active').sort((a,b)=>asNumber_(a.Order)-asNumber_(b.Order)||String(a.AssignmentID).localeCompare(String(b.AssignmentID)));
}

function assignmentPublic_(a) {
  return {id:a.AssignmentID,title:a.Title,topic:a.Topic,difficulty:a.Difficulty,shortDescription:a.ShortDescription,instructions:a.Instructions,requirements:String(a.Requirements||'').split('|').map(x=>x.trim()).filter(Boolean),starterHTML:a.StarterHTML||'',starterCSS:a.StarterCSS||'',xp:asNumber_(a.XP),order:asNumber_(a.Order),status:a.Status};
}

function getStudentAssignments(token) {
  try { const user=requireSession_(token,'STUDENT'), submissions=rows_('Assignment_Submissions').filter(s=>s.StudentID===user.StudentID), byId=submissions.reduce((m,s)=>(m[s.AssignmentID]=s,m),{});
    return {ok:true,data:activeAssignments_().map(a=>{const s=byId[a.AssignmentID];return Object.assign(assignmentPublic_(a),{submissionStatus:s?s.Status:'Not Started',lastSavedAt:s?s.LastSavedAt:null,submittedAt:s?s.SubmittedAt:null,xpAwarded:s?asNumber_(s.XPAwarded):0,teacherRemarks:s?s.TeacherRemarks:''});})};
  } catch(e){return publicError_(e);}
}

function openAssignment(token, assignmentId) {
  try { return withLock_(()=>{const user=requireSession_(token,'STUDENT'), a=activeAssignments_().find(x=>x.AssignmentID===clean_(assignmentId,60)); if(!a)throw new Error('Assignment is not available.'); let s=rows_('Assignment_Submissions').find(x=>x.StudentID===user.StudentID&&x.AssignmentID===a.AssignmentID);
    if(!s){append_('Assignment_Submissions',{SubmissionID:id_('AS'),StudentID:user.StudentID,AssignmentID:a.AssignmentID,HTMLCode:a.StarterHTML||'',CSSCode:a.StarterCSS||'',Status:'In Progress',StartedAt:now_(),LastSavedAt:now_(),XPAwarded:0});s=rows_('Assignment_Submissions').find(x=>x.StudentID===user.StudentID&&x.AssignmentID===a.AssignmentID);}
    return {ok:true,data:{assignment:assignmentPublic_(a),submission:clientSafe_({id:s.SubmissionID,status:s.Status,htmlCode:s.HTMLCode||'',cssCode:s.CSSCode||'',lastSavedAt:s.LastSavedAt||null,submittedAt:s.SubmittedAt||null,xpAwarded:asNumber_(s.XPAwarded),teacherRemarks:s.TeacherRemarks||'',readOnly:s.Status==='Completed'||s.Status==='Submitted'})}};
  }); } catch(e){return publicError_(e);}
}

function validateCode_(html,css){html=String(html||'');css=String(css||'');if(html.length>100000||css.length>100000)throw new Error('Code is too large to save.');return {html:html,css:css};}

function saveAssignmentProgress(token, assignmentId, htmlCode, cssCode) {
  try { return withLock_(()=>{const user=requireSession_(token,'STUDENT'), id=clean_(assignmentId,60), a=activeAssignments_().find(x=>x.AssignmentID===id);if(!a)throw new Error('Assignment is not available.');const code=validateCode_(htmlCode,cssCode),s=rows_('Assignment_Submissions').find(x=>x.StudentID===user.StudentID&&x.AssignmentID===id);if(!s)throw new Error('Open the assignment before saving.');if(s.Status==='Completed'||s.Status==='Submitted')throw new Error('This assignment cannot be edited right now.');updateRow_('Assignment_Submissions',s._row,{HTMLCode:code.html,CSSCode:code.css,Status:'In Progress',LastSavedAt:now_()});return {ok:true,savedAt:now_().toISOString()};});
  } catch(e){return publicError_(e);}
}

function submitAssignment(token, assignmentId, htmlCode, cssCode) {
  try { return withLock_(()=>{const user=requireSession_(token,'STUDENT'),id=clean_(assignmentId,60),a=activeAssignments_().find(x=>x.AssignmentID===id);if(!a)throw new Error('Assignment is not available.');const code=validateCode_(htmlCode,cssCode);if(!code.html.trim())throw new Error('Add some HTML before submitting.');const s=rows_('Assignment_Submissions').find(x=>x.StudentID===user.StudentID&&x.AssignmentID===id);if(!s)throw new Error('Open the assignment before submitting.');if(s.Status==='Completed')throw new Error('This assignment is already completed.');if(s.Status==='Submitted')return {ok:true,status:'Submitted',duplicate:true};updateRow_('Assignment_Submissions',s._row,{HTMLCode:code.html,CSSCode:code.css,Status:'Submitted',LastSavedAt:now_(),SubmittedAt:now_()});return {ok:true,status:'Submitted'};});
  } catch(e){return publicError_(e);}
}

function assignmentSummary_(studentId){const list=rows_('Assignment_Submissions').filter(s=>s.StudentID===studentId),latest=list.slice().sort((a,b)=>new Date(b.LastSavedAt||b.StartedAt)-new Date(a.LastSavedAt||a.StartedAt))[0],assignments=rows_('Assignments').reduce((m,a)=>(m[a.AssignmentID]=a,m),{});return {completed:list.filter(s=>s.Status==='Completed').length,inProgress:list.filter(s=>s.Status==='In Progress'||s.Status==='Needs Revision').length,submitted:list.filter(s=>s.Status==='Submitted').length,recent:latest?{title:(assignments[latest.AssignmentID]||{}).Title||latest.AssignmentID,status:latest.Status}:null};}

function getAdminAssignments(token) {
  try { requireSession_(token,'ADMIN');const students=rows_('Students').reduce((m,s)=>(m[s.StudentID]=s,m),{}),assignments=rows_('Assignments'),map=assignments.reduce((m,a)=>(m[a.AssignmentID]=a,m),{}),subs=rows_('Assignment_Submissions').slice().reverse().map(s=>({id:s.SubmissionID,studentId:s.StudentID,studentName:(students[s.StudentID]||{}).StudentName||s.StudentID,assignmentId:s.AssignmentID,assignmentTitle:(map[s.AssignmentID]||{}).Title||s.AssignmentID,topic:(map[s.AssignmentID]||{}).Topic||'',status:s.Status,submittedAt:s.SubmittedAt||null,lastSavedAt:s.LastSavedAt||null}));return {ok:true,data:{assignments:clientSafe_(assignments.map(assignmentPublic_)),submissions:clientSafe_(subs)}};
  } catch(e){return publicError_(e);}
}

function adminSaveAssignment(token, form) {
  try { return withLock_(()=>{requireSession_(token,'ADMIN');const id=clean_(form.id,40).toUpperCase();if(!/^[A-Z0-9_-]{2,40}$/.test(id))throw new Error('Use a valid unique Assignment ID.');const required=['title','topic','difficulty','shortDescription','instructions'];required.forEach(k=>{if(!clean_(form[k],2000))throw new Error('Complete all required assignment fields.');});const values={AssignmentID:id,Title:clean_(form.title,120),Topic:clean_(form.topic,80),Difficulty:clean_(form.difficulty,30),ShortDescription:clean_(form.shortDescription,300),Instructions:clean_(form.instructions,3000),Requirements:clean_(form.requirements,3000),StarterHTML:String(form.starterHTML||'').slice(0,100000),StarterCSS:String(form.starterCSS||'').slice(0,100000),XP:Math.max(1,Math.min(10000,Math.round(asNumber_(form.xp,50)))),Order:Math.max(0,Math.round(asNumber_(form.order))),Status:['Active','Inactive'].includes(form.status)?form.status:'Inactive',UpdatedAt:now_()},existing=rows_('Assignments').find(a=>a.AssignmentID===id);if(existing)updateRow_('Assignments',existing._row,values);else{values.CreatedAt=now_();append_('Assignments',values);}return {ok:true,id:id};});
  } catch(e){return publicError_(e);}
}

function getAdminSubmission(token, submissionId) {
  try { requireSession_(token,'ADMIN');const s=rows_('Assignment_Submissions').find(x=>x.SubmissionID===clean_(submissionId,60));if(!s)throw new Error('Submission not found.');const a=rows_('Assignments').find(x=>x.AssignmentID===s.AssignmentID),student=findStudent_(s.StudentID);return {ok:true,data:clientSafe_({submission:{id:s.SubmissionID,status:s.Status,htmlCode:s.HTMLCode||'',cssCode:s.CSSCode||'',submittedAt:s.SubmittedAt||null,remarks:s.TeacherRemarks||'',xpAwarded:asNumber_(s.XPAwarded)},assignment:assignmentPublic_(a),student:{id:student.StudentID,name:student.StudentName}})};
  } catch(e){return publicError_(e);}
}

function reviewAssignmentSubmission(token, submissionId, decision, remarks) {
  try { return withLock_(()=>{const admin=requireSession_(token,'ADMIN'),s=rows_('Assignment_Submissions').find(x=>x.SubmissionID===clean_(submissionId,60));if(!s)throw new Error('Submission not found.');const note=clean_(remarks,2000);if(decision==='revision'){if(s.Status!=='Submitted')throw new Error('Only submitted work can be returned for revision.');updateRow_('Assignment_Submissions',s._row,{Status:'Needs Revision',TeacherRemarks:note,ReviewedAt:now_(),ReviewedBy:admin.StudentID});return {ok:true,status:'Needs Revision',xpAwarded:0};}if(decision!=='approve')throw new Error('Invalid review decision.');if(s.Status==='Completed'||asNumber_(s.XPAwarded)>0)return {ok:true,status:'Completed',xpAwarded:asNumber_(s.XPAwarded),duplicate:true};if(s.Status!=='Submitted')throw new Error('Only submitted work can be approved.');const a=rows_('Assignments').find(x=>x.AssignmentID===s.AssignmentID);if(!a)throw new Error('Assignment not found.');const student=findStudent_(s.StudentID);if(!student)throw new Error('Student not found.');const xp=awardXp_(student,'Assignment',a.AssignmentID,a.Title,asNumber_(a.XP),admin.StudentID);updateRow_('Assignment_Submissions',s._row,{Status:'Completed',TeacherRemarks:note,ReviewedAt:now_(),ReviewedBy:admin.StudentID,XPAwarded:xp||asNumber_(a.XP)});const fresh=findStudent_(student.StudentID),badges=checkBadges_(fresh);return {ok:true,status:'Completed',xpAwarded:xp,badges:badges};});
  } catch(e){return publicError_(e);}
}
