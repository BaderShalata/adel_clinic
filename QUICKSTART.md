# Quick Start Guide - Adel Clinic Admin Panel

## 🚀 Running Your Application (3 Simple Steps)

### Step 1: Start Backend (Terminal 1)

Open Command Prompt and run:

```bash
cd C:\Users\pc 0170\Desktop\Projects\adel_clinic\backend
firebase emulators:start
```

**Wait until you see:**
```
✔  All emulators ready!
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators started, it is now safe to connect.       │
└─────────────────────────────────────────────────────────────┘
```

**Emulator URLs:**
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Emulator UI: http://localhost:4000

---

### Step 2: Start Web Admin (Terminal 2)

Open a **NEW** Command Prompt window and run:

```bash
cd C:\Users\pc 0170\Desktop\Projects\adel_clinic\web-admin
npm run dev
```

**Wait until you see:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 3: Create Your Admin Account

1. **Open Browser:** Go to http://localhost:5173

2. **You'll see the Login Page** with a "Don't have an account? Sign Up" button

3. **Click "Sign Up"** or go directly to http://localhost:5173/signup

4. **Fill in the form:**
   - Full Name: `Admin User`
   - Email: `admin@adelclinic.com`
   - Phone: `+1234567890` (optional)
   - Password: `admin123` (or any password 6+ characters)
   - Confirm Password: `admin123`

5. **Click "Create Admin Account"**

6. **Success!** You'll be redirected to login

7. **Login** with your credentials

8. **Welcome to the Dashboard!** 🎉

---

## 📱 What You Can Do Now

### Dashboard
- View total patients, doctors, appointments
- See today's appointments
- View appointment trends chart
- Check appointment status breakdown

### Appointments
- ➕ Create new appointments
- 📝 Edit appointment details
- 🗑️ Delete appointments
- 🔍 Filter by status, doctor, patient, date

### Patients
- ➕ Add new patients
- 📝 Edit patient information
- 🔍 Search patients by name, phone, email
- View medical history (coming soon)

### Doctors
- ➕ Add new doctors
- 📝 Edit doctor profiles
- View specialties and qualifications
- Activate/deactivate doctors

### News
- ➕ Create news articles
- 📝 Edit content
- 📢 Publish/unpublish articles
- Categorize: Announcement, Health Tip, Event, General

### Users
- ➕ Create admin/doctor/patient users
- 📝 Edit user details
- 🔒 Activate/deactivate accounts
- 🗑️ Delete users

---

## 🎨 Features Included

✅ **Authentication** - Firebase Auth with email/password
✅ **Role-Based Access** - Admin, Doctor, Patient roles
✅ **Responsive Design** - Works on desktop, tablet, mobile
✅ **Real-time Updates** - React Query for data management
✅ **Material-UI** - Modern, beautiful interface
✅ **Charts & Analytics** - Recharts for data visualization
✅ **Form Validation** - Built-in validation
✅ **Loading States** - Smooth user experience
✅ **Error Handling** - Clear error messages

---

## 🔧 Troubleshooting

### "Cannot connect to emulator"
- Make sure Step 1 (firebase emulators) is running
- Check that ports 5001, 8080, 9099 are not in use
- Restart both terminals

### "User not found" after signup
- Check Firebase Emulator UI: http://localhost:4000
- Go to Authentication tab
- Verify user was created
- Go to Firestore tab
- Verify 'users' collection has your document

### "CORS error" or "Network error"
- Verify `.env` file in web-admin folder has:
  ```
  VITE_API_URL=http://localhost:5001/adelclinic-35393/us-central1/api
  ```
- Restart web admin server (npm run dev)

### Web admin not loading
```bash
cd web-admin
rm -rf node_modules
npm install
npm run dev
```

---

## 🎯 Next Steps

1. **Create Sample Data:**
   - Add 2-3 doctors
   - Add 5-10 patients
   - Create some appointments
   - Publish a news article

2. **Test Features:**
   - Try filtering appointments
   - Search for patients
   - View analytics dashboard
   - Edit and delete records

3. **Customize:**
   - Add your clinic logo
   - Customize colors in theme
   - Add more fields to forms

4. **Deploy to Production:**
   - See README.md for deployment guide

---

## 📞 Need Help?

- Check Firebase Emulator UI: http://localhost:4000
- View console logs in browser (F12)
- Check terminal output for errors

---

**Enjoy your Adel Clinic Admin Panel!** 🏥✨
