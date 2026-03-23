import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';

export async function POST(req) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Login] Attempt:', {
      username,
      passwordLength: password?.length,
      dbState: mongoose.connection.readyState,
      dbName: mongoose.connection.name
    });

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username and password required' 
      }, { status: 400 });
    }

    // Find user (case-insensitive)
    const user = await User.findOne({ 
      username: username.toLowerCase().trim() 
    });

    console.log('[Login] User lookup result:', user ? {
      found: true,
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      teacherId: user.teacherId?.toString(),
    } : {
      found: false,
      searchedFor: username.toLowerCase().trim()
    });

    if (!user) {
      console.log('[Login] ❌ User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    if (!user.isActive) {
      console.log('[Login] ❌ Account disabled');
      return NextResponse.json({ 
        success: false, 
        error: 'Account is disabled' 
      }, { status: 403 });
    }

    // Compare password
    console.log('[Login] Comparing passwords...');
    const match = await bcrypt.compare(password, user.password);
    
    console.log('[Login] Password match:', match);
    
    if (!match) {
      console.log('[Login] ❌ Invalid password');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Build response user object
    let responseUser = user.toObject();
    responseUser.id = responseUser._id?.toString();
    delete responseUser.password;

    // ✅ If teacher, fetch teacher details for assignedClass
    if (user.role === 'teacher' || user.role === 'teacher-admin') {
      if (user.teacherId) {
        try {
          const teacher = await Teacher.findById(user.teacherId);
          if (teacher) {
            responseUser.assignedClass = teacher.assignedClass || '';
            responseUser.section = teacher.section || '';
            responseUser.classTeacher = teacher.classTeacher || false;
            responseUser.subject = teacher.subject || '';
            responseUser.employeeId = teacher.employeeId || '';
            
            console.log('[Login] ✅ Added teacher details:', {
              assignedClass: responseUser.assignedClass,
              section: responseUser.section,
              classTeacher: responseUser.classTeacher,
              subject: responseUser.subject
            });
          }
        } catch (teacherErr) {
          console.warn('[Login] Could not fetch teacher details:', teacherErr.message);
        }
      } else {
        // Try to find teacher by username if teacherId not set
        try {
          const teacher = await Teacher.findOne({ username: user.username });
          if (teacher) {
            responseUser.assignedClass = teacher.assignedClass || '';
            responseUser.section = teacher.section || '';
            responseUser.classTeacher = teacher.classTeacher || false;
            responseUser.subject = teacher.subject || '';
            responseUser.employeeId = teacher.employeeId || '';
            responseUser.teacherId = teacher._id?.toString();
            
            console.log('[Login] ✅ Found teacher by username:', {
              assignedClass: responseUser.assignedClass,
              section: responseUser.section,
              classTeacher: responseUser.classTeacher
            });
          }
        } catch (teacherErr) {
          console.warn('[Login] Could not find teacher by username:', teacherErr.message);
        }
      }
    }

    console.log('[Login] ✅ Success for:', responseUser.username, 'role:', responseUser.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json({ success: true, user: responseUser });
  } catch (err) {
    console.error('[Login] ❌ Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}