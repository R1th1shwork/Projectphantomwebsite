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

async function sendEmail(toEmail, toName, subject, message) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('Missing BREVO_API_KEY environment variable');
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'PHANTOM Tasks',
        email: 'notifications@projectphantom.space'
      },
      to: [
        {
          email: toEmail,
          name: toName || toEmail
        }
      ],
      replyTo: {
        email: 'admin@projectphantom.space',
        name: 'PHANTOM Admin'
      },
      subject: subject,
      textContent: message
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

    await sendEmail(t.assigneeEmail, t.assigneeName, subject, message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reminder run failed:', err);
    process.exit(1);
  });
