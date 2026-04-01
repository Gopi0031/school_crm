# EduERP — School Management System

A full-stack Next.js School ERP with MongoDB, Cloudinary, and Nodemailer.

## Quick Start

### 1. Install dependencies
    npm install

### 2. Configure environment
    cp .env.local.example .env.local
Fill in MongoDB URI, Cloudinary keys, and SMTP credentials.

### 3. Seed the database
    npm run seed
Populates MongoDB with 40 students, 20 teachers, 15 staff, branches, events, holidays, and reports.

### 4. Start dev server
    npm run dev

---



---

## Configuration

### MongoDB Atlas (Free)
1. https://cloud.mongodb.com — Create free cluster
2. Connect > Drivers — copy the URI
3. Set MONGODB_URI in .env.local

### Cloudinary (Free)
1. https://cloudinary.com — Dashboard
2. Copy Cloud Name, API Key, API Secret

### Gmail SMTP
1. Enable 2FA on your Google account
2. https://myaccount.google.com/apppasswords — create App Password
3. Set SMTP_USER and SMTP_PASS in .env.local

---

## API Routes

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | /api/auth                 | Login                          |
| GET    | /api/students             | List students (filterable)     |
| POST   | /api/students             | Create student                 |
| GET    | /api/students/:id         | Get one student                |
| PUT    | /api/students/:id         | Update student                 |
| DELETE | /api/students/:id         | Delete student                 |
| GET    | /api/teachers             | List teachers                  |
| POST   | /api/teachers             | Create teacher                 |
| PUT    | /api/teachers/:id         | Update teacher                 |
| DELETE | /api/teachers/:id         | Delete teacher                 |
| GET    | /api/staff                | List staff                     |
| POST   | /api/staff                | Create staff                   |
| PUT    | /api/staff/:id            | Update staff                   |
| DELETE | /api/staff/:id            | Delete staff                   |
| GET    | /api/branches             | List branches                  |
| POST   | /api/branches             | Create branch                  |
| PUT    | /api/branches/:id         | Update branch                  |
| DELETE | /api/branches/:id         | Delete branch                  |
| GET    | /api/events               | List events                    |
| POST   | /api/events               | Create event                   |
| PUT    | /api/events/:id           | Update event                   |
| DELETE | /api/events/:id           | Delete event                   |
| GET    | /api/attendance           | Query attendance records       |
| POST   | /api/attendance           | Save single attendance record  |
| POST   | /api/attendance/bulk      | Save bulk attendance records   |
| GET    | /api/fee                  | Fee summary with filters       |
| POST   | /api/fee                  | Record a fee payment           |
| GET    | /api/reports              | List academic reports          |
| POST   | /api/reports              | Create report                  |
| PUT    | /api/reports/:id          | Update report                  |
| DELETE | /api/reports/:id          | Delete report                  |
| GET    | /api/holidays             | List holidays                  |
| POST   | /api/holidays             | Create holiday                 |
| DELETE | /api/holidays/:id         | Delete holiday                 |
| POST   | /api/upload               | Upload image to Cloudinary     |
| POST   | /api/email                | Send email (fee/event/admission/custom) |

### Email API usage
    POST /api/email
    { "type": "fee_reminder", "branch": "Main Branch" }
    { "type": "admission_confirm", "studentId": "<id>" }
    { "type": "event_notification", "eventId": "<id>" }
    { "type": "custom", "to": "x@example.com", "subject": "Hi", "html": "<p>Body</p>" }

### Upload API usage
    POST /api/upload
    { "image": "data:image/jpeg;base64,...", "folder": "students" }
