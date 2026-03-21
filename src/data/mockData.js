// mockData.js - Static fallback data (UI dropdowns and charts only)
// All live data comes from MongoDB via API routes

export const branches = [
  { id: 1, name: 'Main Branch', userId: 'BA001', userName: 'Rajesh Kumar', email: 'rajesh@school.com', phone: '9876543210', role: 'Admin' },
  { id: 2, name: 'East Branch', userId: 'BA002', userName: 'Priya Sharma', email: 'priya@school.com',  phone: '9876543211', role: 'Principal' },
  { id: 3, name: 'West Branch', userId: 'BA003', userName: 'Arjun Singh',  email: 'arjun@school.com',  phone: '9876543212', role: 'Admin' },
];

export const classes       = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
export const sections      = ['A','B','C','D'];
export const departments   = ['Administration','Accounts','Library','Sports','Lab','Transport'];
export const academicYears = ['2024-25','2023-24','2022-23'];
export const exams         = ['Unit Test 1','Unit Test 2','Half Yearly','Annual'];

export const students  = [];
export const teachers  = [];
export const staff     = [];
export const events    = [];
export const reports   = [];
export const holidays  = [];

export const auditLogs = [];

export const dashboardStats = {
  superAdmin: {
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalBranches: 3,
    overallAttendance: 0,
    totalFeeCollected: 0,
    totalFeePending: 0,
    totalAdmissions: 0,
    branchAttendance: [],
    branchFee: [],
    branchAdmissions: [],
  },
  branchAdmin: {
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0,
    totalTeachers: 0,
    presentTeachers: 0,
    absentTeachers: 0,
    totalFee: 0,
    paidFee: 0,
    dueFee: 0,
    classAttendance: [],
  },
};