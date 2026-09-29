import {publicConfig} from './config.js';

const routes={
  '/about':{
    title:'About OPSNORA Learn | Learn • Build • Level Up',
    description:'Learn about OPSNORA Learn and its interactive, structured learning experience.',
    kicker:'ABOUT US',
    heading:'Learning that grows with you',
    intro:'OPSNORA Learn is a learning platform designed to make learning more interactive, structured and engaging.',
    content:`
      <section><h2>Learn • Build • Level Up</h2><p>Students can learn concepts, practise at their own pace and build confidence through clear, measurable progress. The platform is designed to help a learner return and continue from where they stopped.</p></section>
      <section><h2>What the platform offers</h2><ul><li>Interactive quizzes and topic-based practice activities</li><li>XP-based progress, levels, badges and achievements</li><li>Learning streaks and progress tracking</li><li>Saved progress so students can resume learning</li><li>Practical coding and project-based learning activities</li></ul></section>
      <section><h2>Our approach</h2><p>OPSNORA Learn uses simple goals and feedback to encourage consistent learning. Virtual rewards support motivation, while the learning activities remain the main focus.</p></section>`
  },
  '/privacy':{
    title:'Privacy Policy | OPSNORA Learn',
    description:'Read the OPSNORA Learn privacy policy and understand how learning data is handled.',
    kicker:'PRIVACY POLICY',
    heading:'Privacy Policy',
    intro:'This policy explains the information OPSNORA Learn processes and how it is used. Last updated: 29 September 2026.',
    content:`
      <section><h2>Information We Collect</h2><p>The platform stores a student ID, student name, class, account role and account status. It processes a PIN in order to sign in, but stores a hash rather than the plain-text PIN. The current application does not ask students for an email address.</p></section>
      <section><h2>How We Use Information</h2><p>Information is used to authenticate accounts, provide learning activities, save progress, operate student and administrator dashboards, and maintain the security and reliability of the service.</p></section>
      <section><h2>Student Accounts</h2><p>Student and administrator accounts use an ID and PIN. Active sessions use a token in the browser and a hashed token record on the server. Session records may include creation, expiry and last-seen times.</p></section>
      <section><h2>Quiz and Learning Progress</h2><p>We store question attempts, selected answers, whether an answer was correct, scores, response times, quiz runs, assignment work and submissions, XP transactions, levels, badges, streaks, completion records and related timestamps. This allows progress to be restored and shown in the learning dashboards.</p></section>
      <section><h2>Data Storage</h2><p>Application records are stored in Google Sheets through a Google Apps Script backend. The public website uses a server-side API proxy; the browser does not directly access the spreadsheet.</p></section>
      <section><h2>Cookies and Similar Technologies</h2><p>The application currently uses browser local storage to retain the signed-in session token. It does not currently add advertising or analytics cookies. Hosting and third-party infrastructure may process basic technical request information needed to deliver and protect the service.</p></section>
      <section><h2>Advertising</h2><p>Third-party advertising services may be considered in the future. If enabled, advertising technologies may use cookies or similar technologies where legally permitted. OPSNORA Learn will not send student IDs, names, quiz answers, XP, badges or learning progress to advertising providers, and personalized advertising will not be enabled for minors.</p></section>
      <section><h2>Children's and Teen Privacy</h2><p>The platform may be used by students and minors. We aim to collect only information needed to provide and protect the learning experience. We do not implement behavioral profiling for minors or guess a user's age.</p></section>
      <section><h2>Third-Party Services</h2><p>The service currently relies on Google Apps Script and Google Sheets for its backend and Vercel for website hosting and server-side routing. These providers may process data as necessary to provide their services under their own terms and privacy practices.</p></section>
      <section><h2>Data Security</h2><p>PIN hashes, allow-listed API actions, role checks and expiring sessions are used to help protect accounts. No online service can guarantee absolute security, so access credentials should be kept private.</p></section>
      <section><h2>Data Retention</h2><p>Account and learning records are retained while needed to provide the platform and maintain accurate progress. An authorized administrator may reset a student's learning progress. Records may also be retained where reasonably needed for security or legal obligations.</p></section>
      <section><h2>User or Parent Requests</h2><p>A student, parent or guardian may ask the platform operator about available account information, correction or deletion. Requests may require identity or authority verification before account information is changed.</p></section>
      <section><h2>Changes to This Policy</h2><p>This policy may be updated when the platform or its legal obligations change. The updated date on this page will identify the latest version.</p></section>
      <section><h2>Contact</h2><p>${contactSentence()}</p></section>`
  },
  '/terms':{
    title:'Terms & Conditions | OPSNORA Learn',
    description:'Read the terms and conditions for using OPSNORA Learn.',
    kicker:'TERMS & CONDITIONS',
    heading:'Terms & Conditions',
    intro:'These terms describe responsible use of OPSNORA Learn. Last updated: 29 September 2026.',
    content:`
      <section><h2>Acceptance of Terms</h2><p>By using OPSNORA Learn, you agree to use the platform in accordance with these terms. A parent, guardian or school representative may need to approve use where required.</p></section>
      <section><h2>Purpose of the Platform</h2><p>OPSNORA Learn provides educational quizzes, practice, coding activities and progress tools. It supports learning but does not guarantee particular academic results.</p></section>
      <section><h2>Student Accounts</h2><p>Users must provide their assigned account details accurately, keep PINs private and avoid sharing access. Account use may be managed by an authorized teacher or administrator.</p></section>
      <section><h2>Acceptable Use</h2><p>Users must not disrupt the service, access another person's account, bypass security, upload harmful material, or manipulate quiz results, XP, account information or platform functionality.</p></section>
      <section><h2>Quiz and Learning Content</h2><p>Learning content is provided for educational use. Questions and activities may be updated, corrected or removed as the curriculum and platform evolve.</p></section>
      <section><h2>XP, Badges and Streaks</h2><p>XP, levels, badges, streaks and other rewards are virtual learning features unless explicitly stated otherwise. They have no cash value and may be adjusted to correct technical or account errors.</p></section>
      <section><h2>Intellectual Property</h2><p>The platform design, branding and original learning content belong to their respective owners. Users may use the content for personal learning but may not copy or redistribute it without permission.</p></section>
      <section><h2>Availability of the Service</h2><p>We aim to keep the service available, but maintenance, technical issues or third-party outages may cause interruptions. Features may change as the platform is improved.</p></section>
      <section><h2>Third-Party Services</h2><p>The platform relies on services including Google and Vercel. Their availability and use may also be governed by their own terms.</p></section>
      <section><h2>Advertising</h2><p>The platform may include age-appropriate advertising in the future. Advertising will be kept separate from navigation and learning controls, and personalized advertising will not be enabled for minors.</p></section>
      <section><h2>Limitation of Liability</h2><p>The platform is provided as an educational tool. To the extent permitted by law, its operator is not responsible for indirect losses caused by service interruptions, user misuse or third-party service failures. Nothing here limits rights that cannot legally be limited.</p></section>
      <section><h2>Changes to the Terms</h2><p>These terms may be updated as the platform changes. Continued use after an update means the revised terms apply, subject to applicable law.</p></section>
      <section><h2>Contact</h2><p>${contactSentence()}</p></section>`
  },
  '/contact':{
    title:'Contact | OPSNORA Learn',
    description:'Contact OPSNORA Learn with questions, feedback or support requests.',
    kicker:'CONTACT',
    heading:'Contact OPSNORA Learn',
    intro:"Have a question, feedback, or need help with OPSNORA Learn? We'd be happy to hear from you.",
    content:`<section class="contact-panel"><h2>Get in touch</h2>${contactBlock()}</section><section><h2>Before contacting us</h2><p>Please do not include your PIN or other sensitive sign-in information in a message. For account-related requests, enough information may be needed to verify the student, parent, guardian or authorized administrator.</p></section>`
  }
};

function safeEmail(){return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(publicConfig.supportEmail)?publicConfig.supportEmail:''}
function contactSentence(){const email=safeEmail();return email?`Questions or privacy requests can be sent to <a href="mailto:${email}">${email}</a>.`:'Official support contact details will be published here when configured.'}
function contactBlock(){const email=safeEmail();return email?`<p>Email our support team at:</p><a class="contact-email" href="mailto:${email}">${email}</a><p class="public-note">Your email application will open so you can review the message before sending it.</p>`:'<p>Official support contact details have not yet been configured. Please check this page again later.</p>'}

const footer=()=>`<footer class="site-footer public-footer"><nav aria-label="Information"><a href="/about">About</a><span>•</span><a href="/privacy">Privacy</a><span>•</span><a href="/terms">Terms</a><span>•</span><a href="/contact">Contact</a></nav><p>© 2026 OPSNORA Learn. All rights reserved.</p></footer>`;

export function initPublicPages(){
  const path=window.location.pathname.replace(/\/+$/,'')||'/',page=routes[path];
  if(!page)return false;
  document.title=page.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content',page.description);
  document.querySelector('meta[name="robots"]')?.setAttribute('content','index,follow');
  document.querySelector('#loginView')?.classList.add('hidden');
  document.querySelector('#appView')?.classList.add('hidden');
  const view=document.querySelector('#publicView');
  view.classList.remove('hidden');
  view.innerHTML=`<header class="public-header"><a class="public-brand" href="/"><span>O</span><b>OPSNORA <em>LEARN</em></b></a><a class="back-login" href="/">Back to Login →</a></header><main class="public-main"><div class="public-hero"><p class="eyebrow">${page.kicker}</p><h1>${page.heading}</h1><p>${page.intro}</p></div><article class="public-content">${page.content}</article><a class="secondary public-back" href="/">← Back to Login</a></main>${footer()}`;
  return true
}
