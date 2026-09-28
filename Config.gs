const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1SMN6u0kARiM_JjiWsQwIv5lS4T9_07cFBeit-tPfGA4',
  TIMEZONE: 'Asia/Kolkata',
  SESSION_HOURS: 168,
  LEVELS: [
    { level: 1, min: 0, max: 99 }, { level: 2, min: 100, max: 199 },
    { level: 3, min: 200, max: 299 }, { level: 4, min: 300, max: 499 },
    { level: 5, min: 500, max: 749 }, { level: 6, min: 750, max: 999 },
    { level: 7, min: 1000, max: null }
  ],
  SHEETS: {
    Students: ['StudentID','StudentName','PINHash','Class','Role','TotalXP','Level','CurrentQuestion','TotalAttempted','CorrectAnswers','WrongAnswers','CurrentStreak','LongestStreak','LastActiveDate','JoinDate','Status'],
    Questions: ['QuestionID','Topic','SubTopic','Difficulty','Question','OptionA','OptionB','OptionC','OptionD','CorrectAnswer','Explanation','XP','Status'],
    Attempts: ['AttemptID','Timestamp','StudentID','QuestionID','Topic','SelectedAnswer','CorrectAnswer','IsCorrect','AttemptNumber','XPEarned','ResponseTimeSeconds'],
    Progress: ['StudentID','QuestionID','Status','FirstAttemptCorrect','AttemptsCount','XPEarned','CompletedDate'],
    XP_Log: ['TransactionID','Timestamp','StudentID','Source','ReferenceID','Description','XPChange','AddedBy'],
    Badges: ['BadgeID','BadgeName','Description','ConditionType','ConditionValue','Icon','Status'],
    Student_Badges: ['StudentID','BadgeID','EarnedDate'],
    Quiz_Runs: ['RunID','StudentID','Topic','QuizNumber','QuestionIDs','StartedAt','CompletedAt','Score','TotalQuestions','CorrectAnswers','WrongAnswers','XPEarned','Status'],
    Quiz_Run_Answers: ['RunID','StudentID','QuestionID','QuestionNumber','Question','SelectedAnswer','SelectedText','CorrectAnswer','CorrectText','Explanation','IsCorrect','XPEarned','ResponseTimeSeconds','AnsweredAt'],
    Assignments: ['AssignmentID','Title','Topic','Difficulty','ShortDescription','Instructions','Requirements','StarterHTML','StarterCSS','XP','Order','Status','CreatedAt','UpdatedAt'],
    Assignment_Submissions: ['SubmissionID','StudentID','AssignmentID','HTMLCode','CSSCode','Status','StartedAt','LastSavedAt','SubmittedAt','ReviewedAt','ReviewedBy','XPAwarded','TeacherRemarks'],
    Sessions: ['TokenHash','UserID','Role','CreatedAt','ExpiresAt','LastSeenAt','Status'],
    Settings: ['Key','Value','Description']
  }
});
