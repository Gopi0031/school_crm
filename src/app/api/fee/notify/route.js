import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, generateFeeMessage } from '@/lib/whatsapp'; // ✅ Changed

export async function POST(req) {
  try {
    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: 'Student ID required',
      }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        error: 'Student not found',
      }, { status: 404 });
    }

    if (!student.phone || student.phone.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'No valid phone number',
      }, { status: 400 });
    }

    const total = Number(student.totalFee) || 0;
    if (total === 0) {
      return NextResponse.json({
        success: false,
        error: 'Fee not set for this student',
      }, { status: 400 });
    }

    const message = generateFeeMessage(student);
    const result = await sendWhatsAppMessage(student.phone, message);

    if (result.success) {
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
            paidFee: Number(student.paidFee) || 0,
            dueFee: total - (Number(student.paidFee) || 0),
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

      return NextResponse.json({
        success: true,
        message: 'WhatsApp notification sent successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }

  } catch (err) {
    console.error('❌ Notify Error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}