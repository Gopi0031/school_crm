import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Teacher from '@/models/Teacher';
import User from '@/models/User';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: teacher });
  } catch (err) {
    console.error('[GET /api/teachers/[id]]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const {
      password,
      confirmPassword,
      username,
      classTeacher,
      assignedClass,
      branch,
      branchId,
      userId,
      createdAt,
      updatedAt,
      ...updateFields
    } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    // Get existing teacher
    const existingTeacher = await Teacher.findById(id);
    if (!existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    console.log('[Teacher Update] Starting update for:', {
      id: existingTeacher._id.toString(),
      currentUsername: existingTeacher.username,
      newUsername: username,
      userId: existingTeacher.userId?.toString(),
      hasPassword: !!password
    });

    // ✅ Check class teacher conflict if assigning
    if (classTeacher && assignedClass && updateFields.section) {
      const conflict = await Teacher.findOne({
        assignedClass,
        section: updateFields.section,
        classTeacher: true,
        _id: { $ne: id },
        branch: existingTeacher.branch,
      });
      
      if (conflict) {
        return NextResponse.json({ 
          error: `${assignedClass}-${updateFields.section} already has a class teacher: ${conflict.name}` 
        }, { status: 400 });
      }
    }

    // ── Build teacher update object ──
// ── Build teacher update object ──
const teacherUpdate = {
  ...updateFields,
  classTeacher: classTeacher || false,
  assignedClass: classTeacher ? (assignedClass || '') : '',
};

    // ✅ Handle username change
    const normalizedUsername = username ? username.toLowerCase().trim() : existingTeacher.username;
    const usernameChanged = normalizedUsername !== existingTeacher.username?.toLowerCase();

    if (usernameChanged) {
      // Check if username already taken
      const usernameExists = await User.findOne({ 
        username: normalizedUsername,
        _id: { $ne: existingTeacher.userId }
      });
      
      if (usernameExists) {
        console.log('[Username Check] Already taken:', normalizedUsername);
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      
      teacherUpdate.username = normalizedUsername;
      console.log('[Username Update] Changing from', existingTeacher.username, 'to', normalizedUsername);
    }

    // ── Update teacher document ──
    Object.assign(existingTeacher, teacherUpdate);
    existingTeacher.updatedAt = new Date();
    await existingTeacher.save();

    console.log('[Teacher Update] Teacher saved:', {
      id: existingTeacher._id.toString(),
      username: existingTeacher.username,
      userId: existingTeacher.userId?.toString()
    });

    // ── Update or create linked User ──
    if (existingTeacher.userId) {
      // Find linked user
      const linkedUser = await User.findById(existingTeacher.userId);
      
      if (linkedUser) {
        console.log('[User Update] Found linked user:', {
          id: linkedUser._id.toString(),
          currentUsername: linkedUser.username,
          isActive: linkedUser.isActive
        });

        // Update user fields
        linkedUser.name = updateFields.name || existingTeacher.name;
        linkedUser.email = updateFields.email || existingTeacher.email || '';
        linkedUser.phone = updateFields.phone || existingTeacher.phone || '';
        
        // ✅ Update username in User collection
        if (usernameChanged) {
          linkedUser.username = normalizedUsername;
          console.log('[User Update] Username changed to:', normalizedUsername);
        }
        
        // ✅ Update password if provided
        if (password && password.trim().length >= 6) {
          linkedUser.password = await bcrypt.hash(password.trim(), 10);
          console.log('[User Update] Password updated (hash starts with:', linkedUser.password.substring(0, 10) + '...)');
        }

        await linkedUser.save();

        console.log('[User Update] User saved successfully:', {
          id: linkedUser._id.toString(),
          username: linkedUser.username,
          role: linkedUser.role,
          passwordLength: linkedUser.password.length
        });

        // ✅ Verify the update worked
        const verifyUser = await User.findById(linkedUser._id);
        console.log('[User Verify] Re-fetched user:', {
          username: verifyUser.username,
          passwordHash: verifyUser.password.substring(0, 20) + '...'
        });

      } else {
        console.warn('[User Update] Linked user not found with ID:', existingTeacher.userId);
        
        // Create new user if username and password provided
        if (username && password) {
          await createNewUserForTeacher(existingTeacher, normalizedUsername, password);
        }
      }

    } else {
      // No userId - create new user if credentials provided
      if (username && password) {
        await createNewUserForTeacher(existingTeacher, normalizedUsername, password);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: existingTeacher,
      message: password ? 'Teacher and credentials updated' : 'Teacher updated'
    });

  } catch (err) {
    console.error('[PUT /api/teachers/[id]] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Helper function to create new user
async function createNewUserForTeacher(teacher, username, password) {
  console.log('[User Create] Creating new user for teacher:', teacher._id.toString());
  
  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  
  const newUser = await User.create({
    username: username.toLowerCase().trim(),
    password: hashedPassword,
    role: 'teacher',
    name: teacher.name,
    email: teacher.email || '',
    phone: teacher.phone || '',
    branch: teacher.branch,
    branchId: teacher.branchId,
    teacherId: teacher._id,
    employeeId: teacher.employeeId,
    isActive: true,
  });

  // Link user to teacher
  teacher.userId = newUser._id;
  teacher.username = username.toLowerCase().trim();
  await teacher.save();

  console.log('[User Create] New user created and linked:', {
    userId: newUser._id.toString(),
    username: newUser.username,
    teacherId: teacher._id.toString()
  });

  return newUser;
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Deactivate linked user
    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, { isActive: false });
    }

    // Delete teacher
    await Teacher.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Teacher deleted' });
  } catch (err) {
    console.error('[DELETE /api/teachers/[id]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}