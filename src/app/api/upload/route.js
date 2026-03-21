import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req) {
  try {
    const { image, folder } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    const result = await uploadImage(image, folder || 'school-erp');
    return NextResponse.json({ success: true, url: result.url, publicId: result.publicId });
  } catch (err) {
    console.error('Upload error:', err.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
