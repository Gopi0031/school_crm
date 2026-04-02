import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, generateFeeMessage } from '@/lib/whatsapp'; // ✅ Changed

export async function POST(req) {
  try {
    const body = await req.json();
    const { branch, cls, section, academicYear, notifyType = 'all' } = body;

    console.log('🔔 Notify All Request:', { branch, cls, section, academicYear, notifyType });

    if (!branch) {
      return NextResponse.json({
        success: false,
        error: 'Branch is required',
      }, { status: 400 });
    }

    // Build query
    const where = { status: 'Active' };
    where.branch = branch;
    if (cls) where.class = cls;
    if (section) where.section = section;
    if (academicYear) where.academicYear = academicYear;

    // Fetch students
    const students = await prisma.student.findMany({
      where,
      orderBy: [{ class: 'asc' }, { section: 'asc' }, { rollNo: 'asc' }],
    });

    console.log(`📋 Found ${students.length} students`);

    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No students found',
      }, { status: 404 });
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      const total = Number(student.totalFee) || 0;
      const paid = Number(student.paidFee) || 0;
      const due = total - paid;

      // Skip conditions
      if (!student.phone || student.phone.length < 10) {
        results.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section,
          phone: student.phone || 'N/A',
          status: 'skipped',
          error: 'No valid phone number',
        });
        skippedCount++;
        continue;
      }

      if (total === 0) {
        results.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section,
          phone: student.phone,
          status: 'skipped',
          error: 'Fee not set',
        });
        skippedCount++;
        continue;
      }

      if (notifyType === 'due' && due <= 0) {
        results.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section,
          phone: student.phone,
          status: 'skipped',
          error: 'No dues pending',
        });
        skippedCount++;
        continue;
      }

      // Generate message
      const message = generateFeeMessage(student);

      // Send WhatsApp
      const result = await sendWhatsAppMessage(student.phone, message);

      if (result.success) {
        sentCount++;
        results.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section,
          phone: student.phone,
          totalFee: total,
          paidFee: paid,
          dueFee: due,
          status: 'sent',
          message: message,
        });

        // Log notification
        try {
          await prisma.feeNotification.create({
            data: {
              studentId: student.id,
              studentName: student.name,
              rollNo: student.rollNo || '',
              phone: student.phone,
              branch: student.branch || '',
              class: student.class || '',
              section: student.section || '',
              academicYear: student.academicYear || '',
              totalFee: total,
              paidFee: paid,
              dueFee: due,
              message: message,
              status: 'sent',
              twilioSid: '',
              error: '',
              sentAt: new Date(),
            },
          });
        } catch (logErr) {
          console.warn('⚠️ Failed to log notification:', logErr.message);
        }

      } else {
        failedCount++;
        results.push({
          studentId: student.id,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section,
          phone: student.phone,
          totalFee: total,
          paidFee: paid,
          dueFee: due,
          status: 'failed',
          error: result.error,
        });

        // Log failed notification
        try {
          await prisma.feeNotification.create({
            data: {
              studentId: student.id,
              studentName: student.name,
              rollNo: student.rollNo || '',
              phone: student.phone,
              branch: student.branch || '',
              class: student.class || '',
              section: student.section || '',
              academicYear: student.academicYear || '',
              totalFee: total,
              paidFee: paid,
              dueFee: due,
              message: message,
              status: 'failed',
              twilioSid: '',
              error: result.error || 'Unknown error',
              sentAt: new Date(),
            },
          });
        } catch (logErr) {
          console.warn('⚠️ Failed to log notification:', logErr.message);
        }
      }

      // Rate limiting: 2 seconds between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const summary = `✅ Sent: ${sentCount} | ❌ Failed: ${failedCount} | ⏭️ Skipped: ${skippedCount} | 📊 Total: ${students.length}`;

    console.log('📊 Notification Summary:', summary);

    return NextResponse.json({
      success: true,
      data: results,
      summary: summary,
      stats: {
        total: students.length,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount,
      },
    });

  } catch (err) {
    console.error('❌ Notify All Error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}