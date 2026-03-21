import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Teacher from '@/models/Teacher';   // ← ADD
import User from '@/models/User';         // ← ADD
import bcrypt from 'bcryptjs';            // ← ADD

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { password, confirmPassword, ...updateFields } = body;

    const teacher = await Teacher.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const userUpdate = {
      email:  updateFields.email,
      phone:  updateFields.phone,
      branch: updateFields.branch,
    };

    if (updateFields.username) {
      const newUsername = updateFields.username.toLowerCase().trim();
      const conflict = await User.findOne({
        username: { $regex: `^${newUsername}$`, $options: 'i' },
        _id: { $ne: teacher.userId },
      });
      if (conflict) {
        return NextResponse.json({ error: 'Username already taken by another account' }, { status: 400 });
      }
      userUpdate.username = newUsername;
    }

    if (password && password.length >= 6) {
      userUpdate.password = await bcrypt.hash(password, 10);
    }

    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, { $set: userUpdate });
    } else {
      await User.findOneAndUpdate({ teacherId: teacher._id }, { $set: userUpdate });
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, { isActive: false });
    }
    await teacher.deleteOne();

    return NextResponse.json({ success: true, message: 'Teacher deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
