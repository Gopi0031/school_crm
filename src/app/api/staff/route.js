import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Staff from '@/models/Staff';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch     = searchParams.get('branch');
    const department = searchParams.get('department');
    const status     = searchParams.get('status');
    const search     = searchParams.get('search');
    const branchId   = searchParams.get('branchId');

    const query = {};
    if (branch)     query.branch     = branch;
    if (branchId)   query.branchId   = branchId;
    if (department) query.department = department;
    if (status)     query.status     = status;
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { employeeId:  { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const staff = await Staff.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: staff });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name, phone, email, department, designation,
      qualification, experience, joinYear, salary,
      branch, branchId, aadhaar, pan, status,
    } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const count = await Staff.countDocuments({ branch });
    const employeeId = `STF-${branch?.substring(0,3).toUpperCase() || 'SCH'}-${String(count + 1).padStart(4,'0')}`;

    const staff = await Staff.create({
      name, phone, email, department, designation,
      qualification, experience, joinYear,
      salary: Number(salary) || 0,
      branch, branchId, aadhaar, pan, employeeId,
      status: status || 'Active',
    });

    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
