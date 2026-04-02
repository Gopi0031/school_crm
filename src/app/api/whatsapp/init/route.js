import { NextResponse } from 'next/server';
import { initWhatsApp, getWhatsAppStatus } from '@/lib/whatsapp';

export async function GET() {
  try {
    initWhatsApp();
    const status = getWhatsAppStatus();
    
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}