const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function parseDeadline(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate();
  if (typeof d === 'string' && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(d)) {
    const parts = d.split(/[\/\-]/).map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(d);
}

function formatDate(d) {
  if (!d) return '';
  const dt = parseDeadline(d);
  if (!dt || isNaN(dt.getTime())) return String(d);
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
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
  const snapshot = await db.collection('tasks').get();
  const pending = snapshot.docs.filter(doc => doc.data().status !== 'completed');

  if (!pending.length) {
    console.log('No pending tasks. Nothing to remind.');
    return;
  }

  for (const doc of pending) {
    const t = doc.data();
    if (!t.assigneeEmail) continue;

    const deadline = parseDeadline(t.deadline);
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
