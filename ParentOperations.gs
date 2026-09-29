function getAdminParentOperations(token) {
  try {
    requireSession_(token,'ADMIN');
    return {ok:true,data:clientSafe_({
      sessions:rows_('Learning_Sessions').slice().reverse().map(s=>stripRow_(s)),
      scheduleRules:rows_('ScheduleRules').slice().reverse().map(s=>stripRow_(s)),
      plans:rows_('Plans').map(p=>stripRow_(p)),
      subscriptions:rows_('Subscriptions').slice().reverse().map(s=>stripRow_(s)),
      invoices:rows_('Invoices').slice().reverse().map(i=>stripRow_(i)),
      payments:rows_('Payments').slice().reverse().map(p=>stripRow_(p)),
      recipients:rows_('NotificationRecipients').slice().reverse().map(r=>stripRow_(r)),
      communications:rows_('EmailLog').slice(-30).reverse().map(r=>stripRow_(r)),
      students:rows_('Students').filter(s=>String(s.Role||'STUDENT')==='STUDENT').map(s=>({id:s.StudentID,name:s.StudentName,className:s.Class})),
      parents:rows_('Parents').filter(p=>String(p.Status).toLowerCase()==='active').map(p=>({id:p.ParentID,name:p.ParentName}))
    })};
  } catch(error){return publicError_(error);}
}

function adminSaveScheduleRule(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');const student=findStudent_(form.studentId),day=clean_(form.dayOfWeek,20),type=clean_(form.type,30).toUpperCase();
    if(!student)throw new Error('Student not found.');if(!['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].includes(day))throw new Error('Invalid weekday.');if(!['SESSION','QUIZ','ASSIGNMENT','DEADLINE','ACHIEVEMENT'].includes(type))throw new Error('Invalid schedule type.');
    const ruleId=clean_(form.ruleId,60)||id_('RULE'),existing=rows_('ScheduleRules').find(r=>String(r.RuleID)===ruleId),values={StudentID:student.StudentID,DayOfWeek:day,Type:type,Title:clean_(form.title,120),StartTime:clean_(form.startTime,20),EndTime:clean_(form.endTime,20),Mode:clean_(form.mode,30),Description:clean_(form.description,500),Status:clean_(form.status,20)||'Active',XP:Math.max(0,asNumber_(form.xp)),UpdatedAt:now_()};
    if(existing)updateRow_('ScheduleRules',existing._row,values);else append_('ScheduleRules',Object.assign({RuleID:ruleId,CreatedAt:now_()},values));return {ok:true,id:ruleId};
  }); } catch(error){return publicError_(error);}
}

function adminSaveNotificationRecipient(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const student=findStudent_(form.studentId), email=clean_(form.recipientEmail,150), parentId=clean_(form.parentId,40), type=clean_(form.recipientType,40)||'Additional';
    if(!student||String(student.Role||'STUDENT')!=='STUDENT')throw new Error('Student not found.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid recipient email.');
    if(parentId&&!rows_('Parent_Students').some(l=>String(l.ParentID)===parentId&&String(l.StudentID)===String(student.StudentID)&&String(l.Status).toLowerCase()==='active'))throw new Error('Selected parent is not linked to this student.');
    const recipientId=clean_(form.recipientId,60)||id_('REC'), existing=rows_('NotificationRecipients').find(r=>String(r.RecipientID)===recipientId), values={StudentID:student.StudentID,ParentID:parentId,RecipientType:type,RecipientName:clean_(form.recipientName,80),RecipientEmail:email,Enabled:form.enabled!==false&&String(form.enabled).toLowerCase()!=='false',UpdatedAt:now_()};
    if(existing)updateRow_('NotificationRecipients',existing._row,values);else append_('NotificationRecipients',Object.assign({RecipientID:recipientId,CreatedAt:now_()},values));
    return {ok:true,id:recipientId};
  }); } catch(error){return publicError_(error);}
}

function adminSaveLearningSession(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const student=findStudent_(form.studentId), status=clean_(form.status,30), allowed=['Upcoming','Completed','Rescheduled','Cancelled'];
    if(!student||String(student.Role||'STUDENT')!=='STUDENT')throw new Error('Student not found.');
    if(!clean_(form.date,30)||!clean_(form.topic,100))throw new Error('Session date and topic are required.');
    if(!allowed.includes(status))throw new Error('Invalid session status.');
    const sessionId=clean_(form.sessionId,60)||id_('SES'), existing=rows_('Learning_Sessions').find(s=>String(s.SessionID)===sessionId), values={StudentID:student.StudentID,Date:clean_(form.date,30),StartTime:clean_(form.startTime,20),Duration:clean_(form.duration,30),Topic:clean_(form.topic,100),Status:status,TeacherNote:clean_(form.teacherNote,1000),UpdatedAt:now_(),Title:clean_(form.title,120)||'Offline Learning Session',EndTime:clean_(form.endTime,20),Mode:clean_(form.mode,30)||'Offline',Attendance:clean_(form.attendance,30),Notes:clean_(form.notes,1000)};
    if(existing)updateRow_('Learning_Sessions',existing._row,values);else append_('Learning_Sessions',Object.assign({SessionID:sessionId,CreatedAt:now_()},values));safeLearningEvent_(student.StudentID,'SESSION_UPDATE',{sessionId:sessionId,status:status,title:values.Title,date:values.Date,startTime:values.StartTime});
    return {ok:true,id:sessionId};
  }); } catch(error){return publicError_(error);}
}

function adminSavePlan(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const planId=clean_(form.planId,40).toUpperCase(), name=clean_(form.planName,80), fee=form.monthlyFee===''||form.monthlyFee==null?'':asNumber_(form.monthlyFee), cycle=clean_(form.billingCycle,30)||'Monthly', status=clean_(form.status,20)||'Active';
    if(!/^[A-Z0-9_-]{2,40}$/.test(planId)||!name)throw new Error('Plan ID and name are required.');
    if(fee!==''&&fee<0)throw new Error('Platform fee cannot be negative.');
    const existing=rows_('Plans').find(p=>String(p.PlanID)===planId), values={PlanName:name,MonthlyFee:fee,BillingCycle:cycle,Features:clean_(form.features,1000),Status:status,UpdatedAt:now_()};
    if(existing)updateRow_('Plans',existing._row,values);else append_('Plans',Object.assign({PlanID:planId,CreatedAt:now_()},values));
    return {ok:true,id:planId};
  }); } catch(error){return publicError_(error);}
}

function adminSaveSubscription(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const student=findStudent_(form.studentId), parent=findParent_(form.parentId), plan=rows_('Plans').find(p=>String(p.PlanID)===clean_(form.planId,40));
    if(!student||!parent||!plan)throw new Error('Select a valid student, parent and plan.');
    const linked=rows_('Parent_Students').some(l=>String(l.ParentID)===String(parent.ParentID)&&String(l.StudentID)===String(student.StudentID)&&String(l.Status).toLowerCase()==='active');
    if(!linked)throw new Error('This parent is not linked to the selected student.');
    const subscriptionId=clean_(form.subscriptionId,60)||id_('SUB'), existing=rows_('Subscriptions').find(s=>String(s.SubscriptionID)===subscriptionId), values={StudentID:student.StudentID,ParentID:parent.ParentID,PlanID:plan.PlanID,StartDate:clean_(form.startDate,30),NextBillingDate:clean_(form.nextBillingDate,30),Status:clean_(form.status,30)||'Active',UpdatedAt:now_()};
    if(existing)updateRow_('Subscriptions',existing._row,values);else append_('Subscriptions',Object.assign({SubscriptionID:subscriptionId,CreatedAt:now_()},values));
    return {ok:true,id:subscriptionId};
  }); } catch(error){return publicError_(error);}
}

function adminSaveInvoice(token, form) {
  try { return withLock_(function(){
    requireSession_(token,'ADMIN');
    const subscription=rows_('Subscriptions').find(s=>String(s.SubscriptionID)===clean_(form.subscriptionId,60));
    if(!subscription)throw new Error('Subscription not found.');
    const base=Math.max(0,asNumber_(form.baseAmount)), discount=Math.max(0,asNumber_(form.discount)), additional=Math.max(0,asNumber_(form.additionalCharges)), total=Math.max(0,base-discount+additional), status=clean_(form.status,30)||'Upcoming';
    if(!['Upcoming','Due','Paid','Overdue','Cancelled'].includes(status))throw new Error('Invalid invoice status.');
    const invoiceId=clean_(form.invoiceId,60)||id_('INV'), existing=rows_('Invoices').find(i=>String(i.InvoiceID)===invoiceId), values={StudentID:subscription.StudentID,ParentID:subscription.ParentID,SubscriptionID:subscription.SubscriptionID,BillingPeriod:clean_(form.billingPeriod,80),Description:clean_(form.description,200),BaseAmount:base,Discount:discount,AdditionalCharges:additional,TotalAmount:total,DueDate:clean_(form.dueDate,30),Status:status,Notes:clean_(form.notes,1000)};
    if(existing)updateRow_('Invoices',existing._row,values);else append_('Invoices',Object.assign({InvoiceID:invoiceId,CreatedAt:now_()},values));
    return {ok:true,id:invoiceId,totalAmount:total};
  }); } catch(error){return publicError_(error);}
}

function adminRecordPayment(token, form) {
  try { return withLock_(function(){
    const admin=requireSession_(token,'ADMIN'), invoice=rows_('Invoices').find(i=>String(i.InvoiceID)===clean_(form.invoiceId,60));
    if(!invoice)throw new Error('Invoice not found.');
    if(String(invoice.Status)==='Cancelled')throw new Error('A cancelled invoice cannot be paid.');
    const amount=asNumber_(form.amountPaid);if(amount<=0)throw new Error('Payment amount must be greater than zero.');
    const paymentId=id_('PAY');
    append_('Payments',{PaymentID:paymentId,InvoiceID:invoice.InvoiceID,StudentID:invoice.StudentID,ParentID:invoice.ParentID,AmountPaid:amount,PaymentDate:clean_(form.paymentDate,30)||now_(),PaymentMode:clean_(form.paymentMode,50),TransactionReference:clean_(form.transactionReference,100),Status:'Recorded',ReceivedBy:admin.StudentID,CreatedAt:now_()});
    updateRow_('Invoices',invoice._row,{Status:'Paid'});
    return {ok:true,id:paymentId,invoiceId:invoice.InvoiceID};
  }); } catch(error){return publicError_(error);}
}

function stripRow_(row){const copy=Object.assign({},row);delete copy._row;return copy;}
