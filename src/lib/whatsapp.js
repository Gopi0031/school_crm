import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

let client = null;
let isReady = false;
let qrCode = null;

export function initWhatsApp() {
  if (client) return client;

  console.log('🔄 Initializing WhatsApp Client...');

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  // QR Code for first-time setup
  client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
    qrCode = qr;
  });

  // Ready event
  client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
    isReady = true;
    qrCode = null;
  });

  // Authentication success
  client.on('authenticated', () => {
    console.log('✅ WhatsApp authenticated!');
  });

  // Disconnected
  client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
    isReady = false;
  });

  client.initialize();

  return client;
}

export async function sendWhatsAppMessage(to, message) {
  try {
    if (!client) {
      initWhatsApp();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (!isReady) {
      console.log('⏳ WhatsApp not ready yet...');
      return {
        success: false,
        error: 'WhatsApp client not ready. Please scan QR code first.',
      };
    }

    // Format phone number
    let phoneNumber = to.toString().replace(/\D/g, '');
    
    // Add country code if needed
    if (phoneNumber.length === 10) {
      phoneNumber = `91${phoneNumber}`; // India
    }

    // WhatsApp format: number@c.us
    const chatId = `${phoneNumber}@c.us`;

    console.log(`📱 Sending WhatsApp to ${phoneNumber}...`);

    await client.sendMessage(chatId, message);

    console.log(`✅ Message sent successfully!`);

    return {
      success: true,
      to: phoneNumber,
    };

  } catch (error) {
    console.error(`❌ WhatsApp send failed:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function getWhatsAppStatus() {
  return {
    isReady,
    qrCode,
    hasClient: !!client,
  };
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