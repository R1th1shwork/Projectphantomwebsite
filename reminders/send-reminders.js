// Runs once a day via GitHub Actions. Finds every task that isn't completed
// and emails the assignee a reminder. See ../.github/workflows/daily-reminders.yml
// for the schedule, and the setup guide for which secrets this needs.
//
// This uses the Firebase Admin SDK, which authenticates with a service
// account and bypasses firestore.rules entirely. That's expected and fine,
// it's a trusted server-side script, not a client, the rules exist to
// stop the browser from doing this, not this script.

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function formatDate(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function sendEmail(toEmail, subject, message) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: { to_email: toEmail, subject, message }
    })
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('Failed to email', toEmail, '-', res.status, body);
  } else {
    console.log('Reminder sent to', toEmail);
  }
}

async function main() {
  // Tasks written with a missing status field would be silently skipped by
  // a != query, so this pulls everything and filters in code instead,
  // which catches any task regardless of how it was created.
  const snapshot = await db.collection('tasks').get();
  const pending = snapshot.docs.filter(doc => doc.data().status !== 'completed');

  if (!pending.length) {
    console.log('No pending tasks. Nothing to remind.');
    return;
  }

  for (const doc of pending) {
    const t = doc.data();
    if (!t.assigneeEmail) continue;

    const deadline = t.deadline ? new Date(t.deadline) : null;
    const subject = 'Reminder: "' + t.title + '" is still pending';
    const message =
      'Hi ' + (t.assigneeName || '') + ', this is a daily reminder that your task "' + t.title +
      '"' + (deadline ? ' (due ' + formatDate(deadline) + ')' : '') +
      ' has not been marked complete yet. Submit it from the dashboard when it is done.';

    await sendEmail(t.assigneeEmail, subject, message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reminder run failed:', err);
    process.exit(1);
  });
