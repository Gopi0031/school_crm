import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Event from '@/models/Event';
import { sendEmail, feeReminderTemplate, admissionConfirmTemplate, eventNotificationTemplate } from '@/lib/mailer';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { type } = body;

    if (type === 'fee_reminder') {
      // Send fee reminders to all students with pending fee
      const { studentIds, branch, cls } = body;
      const query = { paidFee: { $lt: 45000 } };
      if (studentIds?.length) query._id = { $in: studentIds };
      if (branch) query.branch = branch;
      if (cls) query.class = cls;

      const students = await Student.find(query).select('name email parentName totalFee paidFee');
      if (!students.length) return NextResponse.json({ success: false, message: 'No students found' });

      const results = [];
      for (const student of students) {
        if (!student.email) continue;
        try {
          await sendEmail({
            to: student.email,
            subject: `Fee Payment Reminder - ${student.name}`,
            html: feeReminderTemplate({
              studentName: student.name,
              parentName: student.parentName || 'Parent/Guardian',
              amount: student.totalFee - student.paidFee,
              dueDate: 'Within 7 days',
            }),
          });
          results.push({ email: student.email, status: 'sent' });
        } catch (e) {
          results.push({ email: student.email, status: 'failed', error: e.message });
        }
      }
      return NextResponse.json({ success: true, total: students.length, results });
    }

    if (type === 'admission_confirm') {
      const { studentId } = body;
      const student = await Student.findById(studentId);
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      if (!student.email) return NextResponse.json({ error: 'Student has no email' }, { status: 400 });

      await sendEmail({
        to: student.email,
        subject: `Admission Confirmed - ${student.name}`,
        html: admissionConfirmTemplate({
          studentName: student.name,
          rollNo: student.rollNo,
          className: student.class,
          section: student.section,
        }),
      });
      return NextResponse.json({ success: true, message: `Admission email sent to ${student.email}` });
    }

    if (type === 'event_notification') {
      const { eventId, recipientEmails } = body;
      const event = await Event.findById(eventId);
      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

      // If no specific emails, find relevant students
      let emails = recipientEmails || [];
      if (!emails.length) {
        const studentQuery = {};
        if (event.branch !== 'All') studentQuery.branch = event.branch;
        if (event.class !== 'All') studentQuery.class = event.class;
        if (event.section !== 'All') studentQuery.section = event.section;
        const students = await Student.find(studentQuery).select('email');
        emails = students.map(s => s.email).filter(Boolean);
      }

      if (!emails.length) return NextResponse.json({ success: false, message: 'No recipients found' });

      const results = [];
      for (const email of emails) {
        try {
          await sendEmail({
            to: email,
            subject: `Event Notification: ${event.name}`,
            html: eventNotificationTemplate({
              eventName: event.name,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              description: event.description,
              branch: event.branch,
            }),
          });
          results.push({ email, status: 'sent' });
        } catch (e) {
          results.push({ email, status: 'failed', error: e.message });
        }
      }

      // Mark notification as sent
      await Event.findByIdAndUpdate(eventId, { notificationSent: true });

      return NextResponse.json({ success: true, total: emails.length, results });
    }

    if (type === 'custom') {
      const { to, subject, html, text } = body;
      if (!to || !subject) return NextResponse.json({ error: 'Missing to/subject' }, { status: 400 });
      await sendEmail({ to, subject, html, text });
      return NextResponse.json({ success: true, message: `Email sent to ${to}` });
    }

    return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
  } catch (err) {
    console.error('Email API error:', err);
    return NextResponse.json({ error: 'Email service error: ' + err.message }, { status: 500 });
  }
}
