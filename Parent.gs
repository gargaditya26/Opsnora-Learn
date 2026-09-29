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
    const attempts=rows_('Attempts').filter(x=>String(x.StudentID)===studentId).slice().reverse().map(a=>{
      const q=questionMap[String(a.QuestionID)]||{}, selected=String(a.SelectedAnswer||'').toUpperCase(), correct=String(a.CorrectAnswer||q.CorrectAnswer||'').toUpperCase();
      return {id:a.AttemptID,date:a.Timestamp,questionId:a.QuestionID,question:q.Question||'Question unavailable',topic:a.Topic||q.Topic||'',selectedAnswer:selected,selectedText:answerText_(q,selected),correctAnswer:correct,correctText:answerText_(q,correct),isCorrect:a.IsCorrect===true||String(a.IsCorrect).toLowerCase()==='true',explanation:q.Explanation||'',xp:asNumber_(a.XPEarned),responseTime:asNumber_(a.ResponseTimeSeconds)};
    });
    const quizRuns=rows_('Quiz_Runs').filter(x=>String(x.StudentID)===studentId&&String(x.Status)==='Completed').slice(-20).reverse().map(r=>({id:r.RunID,topic:r.Topic,quizNumber:asNumber_(r.QuizNumber),score:asNumber_(r.Score),total:asNumber_(r.TotalQuestions),correct:asNumber_(r.CorrectAnswers),wrong:asNumber_(r.WrongAnswers),xp:asNumber_(r.XPEarned),completedAt:r.CompletedAt}));
    const assignmentMap=rows_('Assignments').reduce((m,a)=>(m[String(a.AssignmentID)]=a,m),{});
    const assignments=rows_('Assignment_Submissions').filter(x=>String(x.StudentID)===studentId).slice().reverse().map(s=>{const a=assignmentMap[String(s.AssignmentID)]||{};return {id:s.AssignmentID,title:a.Title||s.AssignmentID,topic:a.Topic||'',difficulty:a.Difficulty||'',assignedDate:s.StartedAt||null,dueDate:a.DueDate||null,status:s.Status,xpReward:asNumber_(a.XP),lastSavedAt:s.LastSavedAt,submittedAt:s.SubmittedAt,reviewedAt:s.ReviewedAt,xpAwarded:asNumber_(s.XPAwarded),teacherRemarks:s.TeacherRemarks||''};});
    const learningSessions=rows_('Learning_Sessions').filter(x=>String(x.StudentID)===studentId).map(s=>({id:s.SessionID,date:s.Date,startTime:s.StartTime,duration:s.Duration,topic:s.Topic,status:s.Status,teacherNote:s.TeacherNote||'',createdAt:s.CreatedAt,updatedAt:s.UpdatedAt})).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const plans=rows_('Plans').filter(p=>String(p.Status).toLowerCase()==='active').map(p=>({id:p.PlanID,name:p.PlanName,monthlyFee:p.MonthlyFee===''?null:asNumber_(p.MonthlyFee),billingCycle:p.BillingCycle||'Monthly',features:String(p.Features||'').split('|').map(cleanFeature_).filter(Boolean)}));
    const subscriptions=rows_('Subscriptions').filter(s=>String(s.StudentID)===studentId&&String(s.ParentID)===parentId).slice().reverse(), subscription=subscriptions[0]||null;
    const invoices=rows_('Invoices').filter(i=>String(i.StudentID)===studentId&&String(i.ParentID)===parentId).slice().reverse().map(i=>({id:i.InvoiceID,subscriptionId:i.SubscriptionID,billingPeriod:i.BillingPeriod,description:i.Description,baseAmount:asNumber_(i.BaseAmount),discount:asNumber_(i.Discount),additionalCharges:asNumber_(i.AdditionalCharges),totalAmount:asNumber_(i.TotalAmount),dueDate:i.DueDate||null,status:i.Status,createdAt:i.CreatedAt,notes:i.Notes||''}));
    const invoiceIds=new Set(invoices.map(i=>String(i.id))), payments=rows_('Payments').filter(p=>String(p.StudentID)===studentId&&String(p.ParentID)===parentId&&invoiceIds.has(String(p.InvoiceID))).map(p=>({id:p.PaymentID,invoiceId:p.InvoiceID,amountPaid:asNumber_(p.AmountPaid),paymentDate:p.PaymentDate,paymentMode:p.PaymentMode,transactionReference:p.TransactionReference,status:p.Status}));
    const planMap=plans.reduce((m,p)=>(m[p.id]=p,m),{}), currentSubscription=subscription?{id:subscription.SubscriptionID,planId:subscription.PlanID,plan:planMap[String(subscription.PlanID)]||null,startDate:subscription.StartDate||null,nextBillingDate:subscription.NextBillingDate||null,status:subscription.Status||'',billingCycle:(planMap[String(subscription.PlanID)]||{}).billingCycle||''}:null;
    const settings=rows_('Settings').reduce((m,x)=>(m[String(x.Key)]=String(x.Value||''),m),{}), support={email:settings.SUPPORT_EMAIL||'',phone:settings.SUPPORT_PHONE||'',whatsapp:settings.SUPPORT_WHATSAPP||''};
    const children=links.map(link=>{const child=findStudent_(link.StudentID);return child?{id:child.StudentID,name:child.StudentName,className:child.Class,relationship:link.Relationship||'Parent/Guardian'}:null}).filter(Boolean);
    const relationship=(links.find(x=>String(x.StudentID)===studentId)||{}).Relationship||'Parent/Guardian';
    return {ok:true,data:clientSafe_({parent:{id:parent.ParentID,name:parent.ParentName,relationship:relationship,email:parent.Email||'',phone:parent.Phone||''},children:children,selectedStudentId:studentId,student:{profile:base.profile,stats:base.stats,level:base.level,badges:base.badges,topics:base.topics,recent:base.recent,lastActive:student.LastActiveDate||null},attempts:attempts,quizRuns:quizRuns,assignments:assignments,sessions:learningSessions,billing:{plans:plans,subscription:currentSubscription,invoices:invoices,payments:payments},support:support})};
  } catch(error){return publicError_(error);}
}

function cleanFeature_(value){return clean_(value,120);}

function changeParentPin(token, currentPin, newPin, confirmPin) {
  try { return withLock_(function(){
    const parent=requireSession_(token,'PARENT');
    if(!parent.PINHash||!safeEqual_(parent.PINHash,hash_(currentPin)))throw new Error('Current PIN is incorrect.');
    if(String(newPin).length<6)throw new Error('New PIN must contain at least 6 characters.');
    if(String(newPin)!==String(confirmPin))throw new Error('New PIN and confirmation do not match.');
    if(safeEqual_(parent.PINHash,hash_(newPin)))throw new Error('New PIN must be different from the current PIN.');
    updateRow_('Parents',parent._row,{PINHash:hash_(newPin)});
    revokeSessions_(parent.ParentID);
    return {ok:true,sessionsRevoked:true};
  }); } catch(error){return publicError_(error);}
}

function answerText_(question, answer) {
  return ['A','B','C','D'].includes(answer)?String(question['Option'+answer]||''):'';
}

function getAdminParents(token) {
  try {
    requireSession_(token,'ADMIN');
    const links=rows_('Parent_Students'), students=rows_('Students').filter(s=>String(s.Role||'STUDENT')==='STUDENT').map(s=>({id:s.StudentID,name:s.StudentName,className:s.Class,status:s.Status}));
    const parents=rows_('Parents').map(p=>({id:p.ParentID,name:p.ParentName,email:p.Email||'',phone:p.Phone||'',status:p.Status,joinDate:p.JoinDate,children:links.filter(l=>String(l.ParentID)===String(p.ParentID)&&String(l.Status).toLowerCase()==='active').map(l=>{const s=findStudent_(l.StudentID);return {id:l.StudentID,name:s?s.StudentName:l.StudentID,className:s?s.Class:'',relationship:l.Relationship||'Parent/Guardian'};})}));
    return {ok:true,data:clientSafe_({parents:parents,students:students})};
  } catch(error){return publicError_(error);}
}

function adminSaveParent(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const parentId=clean_(form.parentId,40), name=clean_(form.parentName,80), studentId=clean_(form.studentId,60), relationship=clean_(form.relationship,40)||'Parent/Guardian', pin=String(form.pin||''), email=clean_(form.email,150), phone=clean_(form.phone,30);
    if(!/^[A-Za-z0-9._-]{4,40}$/.test(parentId))throw new Error('Use a valid parent ID with at least 4 characters.');
    if(!name)throw new Error('Parent name is required.');
    const student=findStudent_(studentId);
    if(!student||String(student.Role||'STUDENT')!=='STUDENT')throw new Error('Student not found.');
    if(findStudent_(parentId))throw new Error('That ID is already used by a student or administrator.');
    let parent=findParent_(parentId), created=false;
    if(!parent){
      if(pin.length<6)throw new Error('A new parent PIN must contain at least 6 characters.');
      append_('Parents',{ParentID:parentId,ParentName:name,PINHash:hash_(pin),JoinDate:now_(),Status:'Active',Email:email,Phone:phone}); created=true;
    } else {
      const changes={ParentName:name,Status:'Active',Email:email,Phone:phone};
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
