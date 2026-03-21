// import { NextResponse } from 'next/server';
// import connectDB from '@/lib/mongodb';
// import User from '@/models/User';
// import bcrypt from 'bcryptjs';

// export async function POST(req) {
//   try {
//     await connectDB();
//     const { username, password } = await req.json();

//     const user = await User.findOne({ username: username.toLowerCase().trim() });
//     if (!user) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });

//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });

//     if (!user.isActive) return NextResponse.json({ error: 'Account is deactivated. Contact admin.' }, { status: 403 });

//     const redirectMap = {
//       'super-admin':   '/super-admin/dashboard',
//       'branch-admin':  '/branch-admin/dashboard',
//       'teacher-admin': '/teacher-admin/dashboard',
//       'student':       '/student/dashboard',
//     };

//     return NextResponse.json({
//       success: true,
//       user: {
//         id:       user._id,
//         username: user.username,
//         role:     user.role,
//         name:     user.name,
//         email:    user.email,
//         phone:    user.phone,
//         branch:   user.branch,
//         branchId: user.branchId,
//         class:    user.class,
//         section:  user.section,
//         rollNo:   user.rollNo,
//         profileImage: user.profileImage,
//         redirect: redirectMap[user.role] || '/login',
//       },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }
