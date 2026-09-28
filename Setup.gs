function setupDatabase_() {
  const db = getDb_();
  Object.keys(CONFIG.SHEETS).forEach(name => {
    let s = db.getSheetByName(name); if (!s) s = db.insertSheet(name);
    const headers = CONFIG.SHEETS[name];
    if (s.getLastRow() === 0) s.getRange(1,1,1,headers.length).setValues([headers]);
    else { const current = s.getRange(1,1,1,Math.max(s.getLastColumn(), headers.length)).getValues()[0]; headers.forEach((h,i) => { if (!current.includes(h)) s.getRange(1,s.getLastColumn()+1).setValue(h); }); }
    s.setFrozenRows(1); s.getRange(1,1,1,s.getLastColumn()).setFontWeight('bold').setBackground('#251252').setFontColor('#ffffff');
  });
  seedBadges_(); seedSettings_(); seedStudent_(); seedQuestions_(); seedAssignments_();
  return 'Database ready. Now run setStudentPin_("Aahana01", "your secure PIN") and createAdmin_(...).';
}
function seedBadges_() {
  const existing = new Set(rows_('Badges').map(b => String(b.BadgeID)));
  [
    ['B001','First Step','Complete your first question','COMPLETED',1,'🚀','Active'],
    ['B002','Rising Star','Reach 100 XP','XP',100,'⭐','Active'], ['B003','XP Explorer','Reach 250 XP','XP',250,'🧭','Active'],
    ['B004','XP Champion','Reach 500 XP','XP',500,'🏆','Active'], ['B005','Perfect 10','Get 10 correct answers','CORRECT',10,'🎯','Active'],
    ['B006','Quiz Master','Complete 50 questions','COMPLETED',50,'🧠','Active'], ['B007','7 Day Streak','Maintain a 7-day streak','STREAK',7,'🔥','Active'],
    ['B008','Supreme','Maintain a 30-day streak','STREAK',30,'👑','Active'],
    ['B009','HTML Explorer','Complete 10 HTML questions','TOPIC_HTML',10,'🌐','Active'],
    ['B010','First Coder','Complete your first coding assignment','ASSIGNMENTS',1,'💻','Active'],
    ['B011','HTML Builder','Complete 5 HTML coding assignments','ASSIGNMENT_TOPIC_HTML',5,'🛠️','Active'],
    ['B012','Coding Champion','Complete 10 coding assignments','ASSIGNMENTS',10,'🏅','Active']
  ].filter(r => !existing.has(r[0])).forEach(r => sheet_('Badges').appendRow(r));
}
function seedSettings_() { if (!rows_('Settings').length) [['APP_NAME','OPSNORA LEARN','Application name'],['DAILY_QUIZ_SIZE','5','Reserved for future daily quiz']].forEach(r=>sheet_('Settings').appendRow(r)); }
function seedStudent_() {
  if (findStudent_('Aahana01')) return;
  append_('Students',{StudentID:'Aahana01',StudentName:'Aahana Singhal',Class:'Class 8',Role:'STUDENT',TotalXP:0,Level:1,CurrentQuestion:1,TotalAttempted:0,CorrectAnswers:0,WrongAnswers:0,CurrentStreak:0,LongestStreak:0,JoinDate:now_(),Status:'Active'});
}
function seedQuestions_() {
  if (rows_('Questions').length) return;
  const q = [
    ['Q001','HTML','Basics','Beginner','What does HTML stand for?','Hyper Text Markup Language','High Text Machine Language','Home Tool Markup Language','Hyper Tool Language','A','HTML stands for Hyper Text Markup Language.',10,'Active'],
    ['Q002','HTML','Elements','Beginner','Which tag creates the largest heading?','<h6>','<head>','<h1>','<title>','C','The h1 element is the highest-level heading.',10,'Active'],
    ['Q003','HTML','Links','Beginner','Which attribute specifies a link destination?','src','href','alt','class','B','The href attribute contains the destination URL.',10,'Active'],
    ['Q004','CSS','Basics','Beginner','What is CSS mainly used for?','Storing data','Styling web pages','Sending email','Creating spreadsheets','B','CSS controls the presentation and layout of web pages.',10,'Active'],
    ['Q005','CSS','Selectors','Beginner','Which symbol selects an element by ID?','.','#','@','*','B','A hash symbol prefixes an ID selector.',10,'Active'],
    ['Q006','CSS','Box Model','Intermediate','Which property adds space inside an element border?','margin','padding','gap','outline','B','Padding is the inner space between content and border.',15,'Active'],
    ['Q007','Excel','Formulas','Beginner','Every Excel formula starts with which symbol?','+','=','@','#','B','Excel formulas conventionally start with an equals sign.',10,'Active'],
    ['Q008','Excel','Functions','Beginner','Which function adds a range of numbers?','COUNT','ADD','SUM','TOTAL','C','SUM adds numbers or cell ranges.',10,'Active'],
    ['Q009','Computer Basics','Hardware','Beginner','Which component is often called the brain of a computer?','Monitor','CPU','Keyboard','SSD','B','The CPU executes instructions and performs calculations.',10,'Active'],
    ['Q010','Computer Basics','Storage','Beginner','Which is a long-term storage device?','RAM','Cache','SSD','Register','C','An SSD retains data when power is off.',10,'Active']
  ]; q.forEach(r => sheet_('Questions').appendRow(r));
}

function seedAssignments_() {
  if (rows_('Assignments').length) return;
  const created=now_(), items=[
    ['A001','My First Web Page','HTML','Beginner','Create your first complete web page.','Build a simple page that introduces you.','Add one h1 heading|Add two paragraphs|Add one button','<!-- Start coding here -->\n<h1>My First Web Page</h1>','/* Add your styles here */',50,1,'Active',created,created],
    ['A002','Student Profile Card','HTML & CSS','Beginner','Create a profile card about yourself.','Combine HTML and CSS to make a clean student profile card.','Add a name heading|Add a short introduction|Add one image|Add one button|Add a background color|Add basic spacing','<div class="profile-card">\n  <h1>Your Name</h1>\n  <!-- Keep building -->\n</div>','.profile-card {\n  /* Style your card */\n}',75,2,'Active',created,created],
    ['A003','My Favourite Hobby','HTML & CSS','Beginner','Build a colourful page about your favourite hobby.','Explain your hobby using structured HTML and simple CSS.','Add one heading|Add one paragraph|Add one list|Add one image|Add basic CSS styling','<h1>My Favourite Hobby</h1>\n<!-- Tell us more -->','body {\n  font-family: Arial, sans-serif;\n}',75,3,'Active',created,created]
  ]; items.forEach(r=>sheet_('Assignments').appendRow(r));
}

function setStudentPin_(studentId, newPin) { return setUserPin_(studentId, newPin); }
function createAdmin_(adminId, name, newPin) {
  if (!/^[A-Za-z0-9._-]{4,40}$/.test(adminId) || String(newPin).length < 6) throw new Error('Use a valid admin ID and a PIN of at least 6 characters.');
  if (findStudent_(adminId)) throw new Error('That user ID already exists.');
  append_('Students',{StudentID:adminId,StudentName:clean_(name,80),PINHash:hash_(newPin),Class:'Teacher',Role:'ADMIN',TotalXP:0,Level:1,JoinDate:now_(),Status:'Active'});
  return 'Admin created: ' + adminId;
}
function setUserPin_(studentId, newPin) {
  if (String(newPin).length < 4) throw new Error('PIN must contain at least 4 characters.');
  const s = findStudent_(studentId); if (!s) throw new Error('User not found.');
  updateRow_('Students', s._row, {PINHash:hash_(newPin)}); revokeSessions_(s.StudentID); return 'PIN updated; existing sessions revoked.';
}
