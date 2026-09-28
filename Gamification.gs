function updateStreak_(student) {
  const today=dateKey_(now_()), last=student.LastActiveDate ? dateKey_(student.LastActiveDate) : '';
  if (last===today) return Number(student.CurrentStreak)||0;
  const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
  const streak=last===dateKey_(yesterday) ? (Number(student.CurrentStreak)||0)+1 : 1;
  updateRow_('Students',student._row,{CurrentStreak:streak,LongestStreak:Math.max(streak,Number(student.LongestStreak)||0),LastActiveDate:now_()});
  student.CurrentStreak=streak; student.LongestStreak=Math.max(streak,Number(student.LongestStreak)||0); return streak;
}
function awardXp_(student, source, referenceId, description, amount, addedBy) {
  amount=Math.round(asNumber_(amount)); if (!amount) return 0;
  const duplicate=rows_('XP_Log').some(x=>x.StudentID===student.StudentID && x.Source===source && x.ReferenceID===referenceId);
  if (duplicate) return 0;
  append_('XP_Log',{TransactionID:id_('TX'),Timestamp:now_(),StudentID:student.StudentID,Source:source,ReferenceID:referenceId,Description:clean_(description,200),XPChange:amount,AddedBy:addedBy});
  const total=rows_('XP_Log').filter(x=>x.StudentID===student.StudentID).reduce((n,x)=>n+asNumber_(x.XPChange),0), level=levelForXp_(total).level;
  updateRow_('Students',student._row,{TotalXP:total,Level:level}); student.TotalXP=total; student.Level=level; return amount;
}
function checkBadges_(student) {
  const progress=rows_('Progress').filter(x=>x.StudentID===student.StudentID && x.Status==='Completed');
  const earned=rows_('Student_Badges').filter(x=>x.StudentID===student.StudentID).map(x=>x.BadgeID), unlocked=[];
  rows_('Badges').filter(b=>String(b.Status).toLowerCase()==='active' && !earned.includes(b.BadgeID)).forEach(b=>{
    const type=String(b.ConditionType), value=type==='XP'?asNumber_(student.TotalXP):type==='CORRECT'?asNumber_(student.CorrectAnswers):type==='STREAK'?asNumber_(student.CurrentStreak):type==='ASSIGNMENTS'?completedAssignmentCount_(student.StudentID):type.indexOf('ASSIGNMENT_TOPIC_')===0?completedAssignmentCount_(student.StudentID,type.slice(17)):type.indexOf('TOPIC_')===0?topicCompletedCount_(progress,type.slice(6)):progress.length;
    if(value>=asNumber_(b.ConditionValue)){ append_('Student_Badges',{StudentID:student.StudentID,BadgeID:b.BadgeID,EarnedDate:now_()}); unlocked.push({id:b.BadgeID,name:b.BadgeName,description:b.Description,icon:b.Icon}); }
  }); return unlocked;
}
function badgeView_(student) {
  const progress=rows_('Progress').filter(x=>x.StudentID===student.StudentID&&x.Status==='Completed');
  const earned=rows_('Student_Badges').filter(x=>x.StudentID===student.StudentID).reduce((m,x)=>(m[x.BadgeID]=x.EarnedDate,m),{});
  return rows_('Badges').filter(b=>String(b.Status).toLowerCase()==='active').map(b=>{
    const type=String(b.ConditionType),target=asNumber_(b.ConditionValue),current=type==='XP'?asNumber_(student.TotalXP):type==='CORRECT'?asNumber_(student.CorrectAnswers):type==='STREAK'?asNumber_(student.CurrentStreak):type==='ASSIGNMENTS'?completedAssignmentCount_(student.StudentID):type.indexOf('ASSIGNMENT_TOPIC_')===0?completedAssignmentCount_(student.StudentID,type.slice(17)):type.indexOf('TOPIC_')===0?topicCompletedCount_(progress,type.slice(6)):progress.length;
    const unit=type==='XP'?'XP':type==='STREAK'?'days':'questions';
    return {id:b.BadgeID,name:b.BadgeName,description:b.Description,requirement:b.Description,icon:b.Icon,earned:!!earned[b.BadgeID],earnedDate:earned[b.BadgeID]||null,current:Math.min(current,target),target:target,unit:unit,percent:target?Math.min(100,Math.round(current/target*100)):100};
  });
}

function topicCompletedCount_(progress, topic) {
  const topicIds=new Set(activeQuestions_().filter(q=>String(q.Topic).toLowerCase()===String(topic).toLowerCase()).map(q=>q.QuestionID));
  return progress.filter(p=>topicIds.has(p.QuestionID)).length;
}

function completedAssignmentCount_(studentId, topic) {
  const completed=rows_('Assignment_Submissions').filter(s=>s.StudentID===studentId&&s.Status==='Completed');
  if(!topic)return completed.length;
  const allowed=new Set(rows_('Assignments').filter(a=>String(a.Topic).toLowerCase().indexOf(String(topic).toLowerCase())>=0).map(a=>a.AssignmentID));
  return completed.filter(s=>allowed.has(s.AssignmentID)).length;
}
