import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const FixUser: React.FC = () => {
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    fullName: '',
    phoneNumber: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Create Firestore user document
      await setDoc(doc(db, 'users', formData.uid), {
        uid: formData.uid,
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || '',
        role: 'admin',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess('User document created successfully! You can now login with your credentials.');
      setFormData({ uid: '', email: '', fullName: '', phoneNumber: '' });
    } catch (err: any) {
      console.error('Error creating user document:', err);
      setError(err.message || 'Failed to create user document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom align="center">
              Fix Existing Firebase User
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              If you created a user in Firebase Console, use this page to add the required Firestore document
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>How to get your User ID (UID):</strong>
              </Typography>
              <Typography variant="body2" component="div">
                1. Go to Firebase Emulator UI: <a href="http://localhost:4000" target="_blank" rel="noopener">http://localhost:4000</a><br />
                2. Click "Authentication"<br />
                3. Find your user and copy the "User UID"<br />
                4. Paste it below
              </Typography>
            </Alert>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="User ID (UID)"
                value={formData.uid}
                onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                margin="normal"
                required
                helperText="Copy from Firebase Authentication"
                autoFocus
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
                helperText="Must match the email in Firebase Auth"
              />
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                margin="normal"
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? 'Creating Document...' : 'Fix User & Add Admin Role'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
