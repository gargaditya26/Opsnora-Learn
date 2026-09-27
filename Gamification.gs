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
    const value=b.ConditionType==='XP'?asNumber_(student.TotalXP):b.ConditionType==='CORRECT'?asNumber_(student.CorrectAnswers):b.ConditionType==='STREAK'?asNumber_(student.CurrentStreak):progress.length;
    if(value>=asNumber_(b.ConditionValue)){ append_('Student_Badges',{StudentID:student.StudentID,BadgeID:b.BadgeID,EarnedDate:now_()}); unlocked.push({id:b.BadgeID,name:b.BadgeName,description:b.Description,icon:b.Icon}); }
  }); return unlocked;
}
function badgeView_(student) {
  const earned=rows_('Student_Badges').filter(x=>x.StudentID===student.StudentID).reduce((m,x)=>(m[x.BadgeID]=x.EarnedDate,m),{});
  return rows_('Badges').filter(b=>String(b.Status).toLowerCase()==='active').map(b=>({id:b.BadgeID,name:b.BadgeName,description:b.Description,icon:b.Icon,earned:!!earned[b.BadgeID],earnedDate:earned[b.BadgeID]||null}));
}
