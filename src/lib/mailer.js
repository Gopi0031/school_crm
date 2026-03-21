import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html, text }) {
  await transporter.sendMail({
    from: `"School ERP" <${process.env.EMAIL_USER}>`,
    to, subject, html, text,
  });
}

export function feeReminderTemplate({ studentName, parentName, amount, dueDate }) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="color:#ef4444">Fee Payment Reminder</h2>
      <p>Dear <strong>${parentName}</strong>,</p>
      <p>This is a reminder that a fee payment of <strong>₹${amount}</strong> is due for <strong>${studentName}</strong>.</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
      <p style="color:#64748b;font-size:0.85rem">Please contact the school office for payment. Thank you.</p>
    </div>`;
}

export function admissionConfirmTemplate({ studentName, rollNo, className, section }) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="color:#10b981">Admission Confirmed!</h2>
      <p>Dear Parent/Guardian,</p>
      <p>We are pleased to confirm the admission of <strong>${studentName}</strong>.</p>
      <ul>
        <li><strong>Roll No:</strong> ${rollNo}</li>
        <li><strong>Class:</strong> ${className} — Section ${section}</li>
      </ul>
      <p>Welcome to our school family!</p>
    </div>`;
}

export function eventNotificationTemplate({ eventName, date, startTime, endTime, description, branch }) {
  return `
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
      <h2 style="color:#4f46e5">Event: ${eventName}</h2>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${startTime} – ${endTime}</p>
      <p><strong>Branch:</strong> ${branch}</p>
      ${description ? `<p><strong>Details:</strong> ${description}</p>` : ''}
    </div>`;
}
