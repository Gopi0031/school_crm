import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const staff = await Staff.findById(params.id);
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: staff });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body = await req.json();
    const staff = await Staff.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: staff });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const staff = await Staff.findById(params.id);
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    if (staff.profileImagePublicId) await deleteImage(staff.profileImagePublicId);
    await staff.deleteOne();
    return NextResponse.json({ success: true, message: 'Staff deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
