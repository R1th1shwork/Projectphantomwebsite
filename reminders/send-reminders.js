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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailHtml(subject, message) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Phantom</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700&display=swap');
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px !important; }
      .mobile-padding { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 36px 12px; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #d4d4d8;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #0c0d11; border: 1px solid #1f2128; border-radius: 4px; overflow: hidden;">
          <tr>
            <td style="padding: 12px 24px; border-bottom: 1px solid #16181f; background-color: #08090c;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="font-family: 'Space Mono', ui-monospace, monospace; font-size: 10px; letter-spacing: 0.18em; color: #525866; text-transform: uppercase;">
                    SYS // PHANTOM DISPATCH
                  </td>
                  <td align="right" style="font-family: 'Space Mono', ui-monospace, monospace; font-size: 10px; letter-spacing: 0.15em; color: #717786;">
                    AUTONOMOUS
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 34px 24px 26px 24px;">
              <a href="https://projectphantom.space" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="https://projectphantom.space/assets/nav.png" alt="PHANTOM" width="44" height="44" style="display: block; margin: 0 auto 14px auto; border: 0;" />
                <span style="display: block; font-family: 'Space Grotesk', -apple-system, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.3em; color: #ffffff; text-transform: uppercase;">
                  PROJECT PHANTOM
                </span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px;">
              <div style="height: 1px; background-color: #1a1c24;"></div>
            </td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 20px 0; font-family: 'Space Grotesk', -apple-system, sans-serif; font-size: 20px; font-weight: 600; line-height: 1.35; color: #ffffff; letter-spacing: -0.02em;">
                ${escapeHtml(subject)}
              </h1>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07080a; border: 1px solid #1c1e26; border-left: 3px solid #ffffff; border-radius: 2px; margin: 0 0 28px 0;">
                <tr>
                  <td style="padding: 20px 22px; font-size: 14px; line-height: 1.65; color: #a1a1aa;">
                    ${escapeHtml(message).replace(/\n/g, '<br/>')}
                  </td>
                </tr>
              </table>
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 12px 0;">
                <tr>
                  <td align="center" style="background-color: #ffffff; border-radius: 2px;">
                    <a href="https://projectphantom.space/tasks.html" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: 'Space Grotesk', -apple-system, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; color: #000000; text-decoration: none; text-transform: uppercase;">
                      Open Task Terminal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px;">
              <div style="height: 1px; background-color: #16181f;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 28px; background-color: #08090c; text-align: center;">
              <p style="margin: 0 0 6px 0; font-family: 'Space Mono', ui-monospace, monospace; font-size: 10px; letter-spacing: 0.15em; color: #525866; text-transform: uppercase;">
                PROJECT PHANTOM &bull; WORKSPACE PROTOCOL &bull; <a href="https://projectphantom.space" target="_blank" style="color: #717786; text-decoration: none;">PROJECTPHANTOM.SPACE</a>
              </p>
              <p style="margin: 0; font-family: -apple-system, sans-serif; font-size: 11px; color: #3f4452;">
                This automated transmission was dispatched to your verified team account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(toEmail, toName, subject, message) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('Missing BREVO_API_KEY environment variable');
  }

  const htmlContent = buildEmailHtml(subject, message);

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
      htmlContent: htmlContent,
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
