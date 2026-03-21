import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveOtp } from '@/lib/otpStore';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });

    // Debug — remove in production
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOtp(email.toLowerCase().trim(), otp);
    console.log('[OTP] Generated and saved:', otp, 'for', email);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify(); // will throw here if credentials are wrong
    console.log('[SMTP] Connection verified ✓');

    await transporter.sendMail({
      from: `"SchoolERP" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Password Change OTP — SchoolERP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
          <h2 style="color:#4338ca;margin-bottom:8px;">Password Change Request</h2>
          <p style="color:#64748b;margin-bottom:24px;">Use the OTP below. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:12px;padding:24px;text-align:center;border:1.5px solid #c7d2fe;">
            <div style="font-size:2.5rem;font-weight:900;letter-spacing:0.3em;color:#4338ca;">${otp}</div>
          </div>
          <p style="color:#94a3b8;font-size:0.8rem;margin-top:20px;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    console.log('[OTP] Email sent successfully to:', email);
    return NextResponse.json({ success: true, message: 'OTP sent to your email' });

  } catch (err) {
    console.error('[send-otp] FULL ERROR:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
