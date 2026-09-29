function login(studentId, pin) {
  try {
    const student=findStudent_(studentId), parent=student?null:findParent_(studentId), user=student||parent;
    if (!user || String(user.Status).toLowerCase() !== 'active' || !user.PINHash || !safeEqual_(user.PINHash, hash_(pin))) throw new Error('Invalid ID or PIN.');
    const role=student?(user.Role||'STUDENT'):'PARENT', userId=student?user.StudentID:user.ParentID, name=student?user.StudentName:user.ParentName;
    const token = Utilities.getUuid() + Utilities.getUuid(), created = now_(), expires = new Date(created.getTime() + CONFIG.SESSION_HOURS * 3600000);
    append_('Sessions',{TokenHash:hash_(token),UserID:userId,Role:role,CreatedAt:created,ExpiresAt:expires,LastSeenAt:created,Status:'Active'});
    return {ok:true, token:token, role:role, name:name};
  } catch(e) { return publicError_(e); }
}
function requireSession_(token, requiredRole) {
  if (!token) throw new Error('Please sign in again.');
  const h = hash_(token), session = rows_('Sessions').find(s => s.TokenHash === h && s.Status === 'Active');
  if (!session || new Date(session.ExpiresAt) <= now_()) throw new Error('Your session has expired. Please sign in again.');
  if (requiredRole && session.Role !== requiredRole) throw new Error('You are not authorized for this action.');
  updateRow_('Sessions', session._row, {LastSeenAt:now_()});
  const user=session.Role==='PARENT'?findParent_(session.UserID):findStudent_(session.UserID); if (!user || String(user.Status).toLowerCase() !== 'active') throw new Error('Account is inactive.');
  return user;
}
function logout(token) { try { const h=hash_(token); const s=rows_('Sessions').find(x=>x.TokenHash===h); if(s) updateRow_('Sessions',s._row,{Status:'Revoked'}); return {ok:true}; } catch(e){ return publicError_(e); } }
function revokeSessions_(id) { rows_('Sessions').filter(s=>s.UserID===id && s.Status==='Active').forEach(s=>updateRow_('Sessions',s._row,{Status:'Revoked'})); }
