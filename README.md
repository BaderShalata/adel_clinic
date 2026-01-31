# Adel Clinic - Full Stack Application

Complete clinic management system with mobile app, web admin panel, and Firebase backend.

## Project Structure

```
adel_clinic/
├── backend/         # Firebase Cloud Functions + Express API
├── web-admin/       # React Admin Panel
└── mobile/          # Flutter Mobile App
```

## Backend Setup (Firebase Cloud Functions)

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase (if not already done)

```bash
cd backend
firebase init
```

Select:
- Functions
- Firestore
- Use existing project: `adelclinic-35393`
- Use TypeScript
- Install dependencies

### 4. Build the Backend

```bash
npm run build
```

### 5. Start Firebase Emulator (Local Development)

```bash
firebase emulators:start
```

This will start:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099

### 6. Deploy to Production (when ready)

```bash
npm run deploy
```

## Web Admin Panel Setup

### 1. Install Dependencies

```bash
cd web-admin
npm install
```

### 2. Configure Environment

The `.env` file is already created with:
```
VITE_API_URL=http://localhost:5001/adelclinic-35393/us-central1/api
```

For production, update to:
```
VITE_API_URL=https://us-central1-adelclinic-35393.cloudfunctions.net/api
```

### 3. Run Development Server

```bash
npm run dev
```

Access at: http://localhost:5173

### 4. Build for Production

```bash
npm run build
```

## Creating Your First Admin User

### Option 1: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `adelclinic-35393`
3. Go to Authentication → Users
4. Add user manually
5. Go to Firestore → Create document in `users` collection:
   ```json
   {
     "uid": "<user-uid-from-auth>",
     "email": "admin@adelclinic.com",
     "fullName": "Admin User",
     "role": "admin",
     "isActive": true,
     "createdAt": <timestamp>,
     "updatedAt": <timestamp>
   }
   ```
6. Set custom claims in Firebase Console or using Firebase CLI:
   ```bash
   firebase auth:update <user-uid> --custom-claims '{"role":"admin"}'
   ```

### Option 2: Using the API

After starting the emulator, use the API to create an admin:

```bash
curl -X POST http://localhost:5001/adelclinic-35393/us-central1/api/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "admin@adelclinic.com",
    "password": "SecurePassword123!",
    "fullName": "Admin User",
    "role": "admin"
  }'
```

## API Endpoints

### Authentication
All endpoints (except public ones) require `Authorization: Bearer <token>` header.

### Users
- `POST /api/users` - Create user (admin only)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/users/:id/activate` - Activate user (admin only)
- `POST /api/users/:id/deactivate` - Deactivate user (admin only)

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get all appointments (with filters)
- `GET /api/appointments/today` - Get today's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Patients
- `POST /api/patients` - Create patient
- `GET /api/patients` - Get all patients (with search)
- `GET /api/patients/stats` - Get patient statistics
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `POST /api/doctors` - Create doctor (admin only)
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/specialty/:specialty` - Get doctors by specialty
- `PUT /api/doctors/:id` - Update doctor (admin only)
- `DELETE /api/doctors/:id` - Delete doctor (admin only)

### News
- `POST /api/news` - Create news (admin only)
- `GET /api/news` - Get all news (admin only)
- `GET /api/news/published` - Get published news (public)
- `GET /api/news/:id` - Get news by ID (admin only)
- `PUT /api/news/:id` - Update news (admin only)
- `DELETE /api/news/:id` - Delete news (admin only)

### Files
- `POST /api/files` - Upload file metadata
- `GET /api/files` - Get all files (with filters)
- `GET /api/files/patient/:patientId` - Get files by patient
- `GET /api/files/:id` - Get file by ID
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file

### Analytics
- `GET /api/analytics` - Get dashboard analytics
- `GET /api/analytics/trends` - Get appointment trends

## Tech Stack

### Backend
- Firebase Cloud Functions
- Express.js
- TypeScript
- Firebase Admin SDK
- Firestore

### Web Admin
- React 19
- TypeScript
- Material-UI (MUI)
- React Query (TanStack Query)
- React Router v7
- Firebase Auth
- Axios
- Recharts (for analytics)
- Day.js

### Mobile
- Flutter
- Dart

## Security

- JWT-based authentication via Firebase Auth
- Role-based access control (admin, doctor, patient)
- All sensitive endpoints protected with middleware
- Custom claims for role management

## Development Workflow

1. **Start Backend**: `cd backend && firebase emulators:start`
2. **Start Web Admin**: `cd web-admin && npm run dev`
3. **Start Mobile**: `cd mobile && flutter run`

## Troubleshooting

### Backend build errors
```bash
cd backend
rm -rf node_modules lib
npm install
npm run build
```

### Web admin errors
```bash
cd web-admin
rm -rf node_modules dist
npm install
npm run dev
```

### Firebase emulator not starting
- Check if ports 5001, 8080, 9099 are available
- Kill any processes using those ports
- Try `firebase emulators:start --only functions,firestore,auth`

## License

Private - Adel Clinic

## Support

For issues or questions, contact the development team.
