import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';

// ✅ Sends real WhatsApp message via Meta Cloud API
async function sendWhatsApp(phone, message) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
  await axios.post(url, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: `91${phone}`,           // India prefix
    type: 'text',
    text: { preview_url: false, body: message },
  }, {
    headers: {
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(req) {
  try {
    const { branch, cls, section } = await req.json();

    const students = await prisma.student.findMany({
      where: {
        ...(branch  && { branch }),
        ...(cls     && { class: cls }),
        ...(section && { section }),
        NOT: { phone: '' },
      },
      orderBy: { name: 'asc' },
    });

    const results = [];

    for (const s of students) {
      if (!s.phone) continue;

      const total   = s.totalFee || 0;
      const paid    = s.paidFee  || 0;
      const allPaid = paid >= total && total > 0;

      const t1Due = s.term1Due || 0;
      const t2Due = s.term2Due || 0;
      const t3Due = s.term3Due || 0;
      const t1    = s.term1    || 0;
      const t2    = s.term2    || 0;
      const t3    = s.term3    || 0;

      const t1Status = t1 > 0 && t1Due === 0 ? `✅ ₹${t1.toLocaleString()} Paid`    : t1Due > 0 ? `⚠️ ₹${t1Due.toLocaleString()} Pending` : '—';
      const t2Status = t2 > 0 && t2Due === 0 ? `✅ ₹${t2.toLocaleString()} Paid`    : t2Due > 0 ? `⚠️ ₹${t2Due.toLocaleString()} Pending` : '—';
      const t3Status = t3 > 0 && t3Due === 0 ? `✅ ₹${t3.toLocaleString()} Paid`    : t3Due > 0 ? `⚠️ ₹${t3Due.toLocaleString()} Pending` : '—';

      const msg = allPaid
        ? `Dear Parent of ${s.name},\n\n✅ All fees paid. Thank you!\n\nStudent: ${s.name} (${s.rollNo})\nClass: ${s.class}-${s.section}\nTotal: ₹${total.toLocaleString()}\n\n— School Management`
        : `Dear Parent of ${s.name},\n\n📋 Fee Reminder\n\nStudent: ${s.name} (${s.rollNo})\nClass: ${s.class}-${s.section}\nTotal Fee: ₹${total.toLocaleString()}\n\nTerm 1: ${t1Status}\nTerm 2: ${t2Status}\nTerm 3: ${t3Status}\n\nOutstanding: ₹${(total - paid).toLocaleString()}\n\nPlease clear dues at the earliest.\n— School Management`;

      try {
        await sendWhatsApp(s.phone, msg);
        results.push({ name: s.name, phone: s.phone, status: 'sent' });
      } catch (err) {
        // Log failed ones but continue sending to others
        results.push({ name: s.name, phone: s.phone, status: 'failed', error: err.response?.data?.error?.message || err.message });
      }

      // ✅ 300ms gap to avoid Meta rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    const sent   = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      data: results,
      summary: `✅ ${sent} sent, ❌ ${failed} failed`,
    });
  } catch (err) {
    console.error('[notify-all]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
