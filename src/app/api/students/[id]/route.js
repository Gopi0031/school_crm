import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: student });
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

    const student = await Student.findByIdAndUpdate(
      id,
      { ...updateFields, ...(updateFields.username ? { username: updateFields.username.toLowerCase().trim() } : {}) },
      { new: true, runValidators: true }
    );
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // ── Build user update ──────────────────────────────────
    const userUpdate = {
      name:    updateFields.name    || student.name,
      email:   updateFields.email   || '',
      phone:   updateFields.phone   || '',
      class:   updateFields.class   || '',
      section: updateFields.section || '',
      branch:  updateFields.branch  || '',
    };

    if (updateFields.username) {
      const newUsername = updateFields.username.toLowerCase().trim();
      const conflict = await mongoose.connection.db.collection('users').findOne({
        username: newUsername,
        _id: { $ne: student.userId ? new mongoose.Types.ObjectId(String(student.userId)) : null },
      });
      if (conflict) {
        return NextResponse.json({ error: 'Username already taken by another account' }, { status: 400 });
      }
      userUpdate.username = newUsername;
    }

    if (password && password.trim().length >= 6) {
      userUpdate.password = await bcrypt.hash(password.trim(), 10);
    }

    const usersCol = mongoose.connection.db.collection('users');

    // ── Try all 3 ways to find the linked user ─────────────
    const studentObjId = new mongoose.Types.ObjectId(String(student._id));
    let userFound = false;

    // Method 1: by userId stored on student doc
    if (student.userId) {
      const res = await usersCol.updateOne(
        { _id: new mongoose.Types.ObjectId(String(student.userId)) },
        { $set: { ...userUpdate, updatedAt: new Date() } }
      );
      if (res.matchedCount > 0) userFound = true;
    }

    // Method 2: by studentId stored on user doc (bulk-uploaded students)
    if (!userFound) {
      const res = await usersCol.updateOne(
        { studentId: studentObjId },
        { $set: { ...userUpdate, updatedAt: new Date() } }
      );
      if (res.matchedCount > 0) {
        userFound = true;
        // Also backfill userId on the student doc so next edit works faster
        const linkedUser = await usersCol.findOne({ studentId: studentObjId });
        if (linkedUser) {
          await Student.findByIdAndUpdate(id, { userId: linkedUser._id });
        }
      }
    }

    // Method 3: by rollNo (last resort)
    if (!userFound && student.rollNo) {
      await usersCol.updateOne(
        { rollNo: student.rollNo, role: 'student' },
        { $set: { ...userUpdate, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch (err) {
    console.error('PUT student error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    if (student.profileImagePublicId) await deleteImage(student.profileImagePublicId);

    const usersCol = mongoose.connection.db.collection('users');

    // Deactivate user by all 3 methods too
    if (student.userId) {
      await usersCol.updateOne(
        { _id: new mongoose.Types.ObjectId(String(student.userId)) },
        { $set: { isActive: false } }
      );
    } else {
      await usersCol.updateOne(
        { $or: [
          { studentId: new mongoose.Types.ObjectId(String(student._id)) },
          { rollNo: student.rollNo, role: 'student' },
        ]},
        { $set: { isActive: false } }
      );
    }

    await student.deleteOne();
    return NextResponse.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
