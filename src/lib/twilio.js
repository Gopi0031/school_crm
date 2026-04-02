import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// ✅ Remove 'whatsapp:' prefix from env variable
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

let client = null;

export function getTwilioClient() {
  if (!client) {
    if (!accountSid || !authToken) {
      console.error('❌ Twilio credentials not configured');
      return null;
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

export async function sendWhatsAppMessage(to, message) {
  try {
    const client = getTwilioClient();
    
    if (!client) {
      console.log('⚠️ Twilio not configured - simulating send');
      return { 
        success: true, 
        sid: 'SIMULATED_' + Date.now(),
        simulated: true
      };
    }

    // ✅ Clean and format phone number
    let phoneNumber = to.toString().replace(/\D/g, ''); // Remove all non-digits
    
    // Add country code if 10 digits (India)
    if (phoneNumber.length === 10) {
      phoneNumber = `91${phoneNumber}`;
    }
    
    // Ensure it starts with +
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber}`;
    }

    // ✅ Both From and To MUST have 'whatsapp:' prefix
    const fromNumber = `whatsapp:${twilioWhatsAppNumber}`;
    const toNumber = `whatsapp:${phoneNumber}`;

    console.log(`📱 Sending WhatsApp...`);
    console.log(`   From: ${fromNumber}`);
    console.log(`   To: ${toNumber}`);

    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message,
    });

    console.log(`✅ Message sent successfully!`);
    console.log(`   SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };

  } catch (error) {
    console.error(`❌ WhatsApp send failed:`, error.message);
    console.error(`   Error code: ${error.code}`);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

export function generateFeeMessage(student, schoolName = 'School') {
  const total = Number(student.totalFee) || 0;
  const paid = Number(student.paidFee) || 0;
  const due = Math.max(0, total - paid);
  
  const base = total > 0 ? Math.floor(total / 3) : 0;
  const extra = total > 0 ? total - base * 3 : 0;
  
  const term1Expected = base + extra;
  const term2Expected = base;
  const term3Expected = base;
  
  const term1Paid = Number(student.term1) || 0;
  const term2Paid = Number(student.term2) || 0;
  const term3Paid = Number(student.term3) || 0;
  
  const term1Due = Math.max(0, term1Expected - term1Paid);
  const term2Due = Math.max(0, term2Expected - term2Paid);
  const term3Due = Math.max(0, term3Expected - term3Paid);

  let message = `🏫 *${student.branch || schoolName}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *FEE NOTIFICATION*\n`;
  message += `━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `👤 *Student:* ${student.name}\n`;
  message += `🎓 *Class:* ${student.class} - ${student.section}\n`;
  message += `🔢 *Roll No:* ${student.rollNo}\n`;
  message += `👨‍👩‍👧 *Parent:* ${student.parentName || 'N/A'}\n`;
  message += `📅 *Year:* ${student.academicYear || '2024-25'}\n\n`;
  
  message += `💰 *FEE DETAILS*\n`;
  message += `Total Fee: ₹${total.toLocaleString('en-IN')}\n`;
  message += `Paid: ₹${paid.toLocaleString('en-IN')} ✅\n`;
  message += `*Due: ₹${due.toLocaleString('en-IN')}* ${due > 0 ? '⚠️' : '✅'}\n\n`;

  if (due > 0) {
    message += `📊 *TERM-WISE STATUS*\n`;
    message += `Term 1: ₹${term1Paid.toLocaleString('en-IN')}/${term1Expected.toLocaleString('en-IN')}`;
    if (term1Due > 0) message += ` (₹${term1Due.toLocaleString('en-IN')} due)`;
    message += `\n`;
    
    message += `Term 2: ₹${term2Paid.toLocaleString('en-IN')}/${term2Expected.toLocaleString('en-IN')}`;
    if (term2Due > 0) message += ` (₹${term2Due.toLocaleString('en-IN')} due)`;
    message += `\n`;
    
    message += `Term 3: ₹${term3Paid.toLocaleString('en-IN')}/${term3Expected.toLocaleString('en-IN')}`;
    if (term3Due > 0) message += ` (₹${term3Due.toLocaleString('en-IN')} due)`;
    message += `\n\n`;
    
    message += `⏰ Please clear the pending dues at the earliest.\n\n`;
  } else {
    message += `✅ All fees have been cleared!\n`;
    message += `Thank you for your timely payment.\n\n`;
  }

  message += `📞 For queries, contact school office.\n\n`;
  message += `_Automated message from ${student.branch || schoolName}_`;

  return message;
}