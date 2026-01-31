#!/usr/bin/env node

/**
 * Script to set a user as admin in Firebase
 * Usage: node set-admin-role.js <user-email>
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./adelclinic-35393-firebase-adminsdk-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const userEmail = process.argv[2] || 'shalatab4@gmail.com';

async function setAdminRole() {
  try {
    console.log(`Setting admin role for user: ${userEmail}`);
    
    const user = await admin.auth().getUserByEmail(userEmail);
    
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`✓ Successfully set admin role for ${userEmail}`);
    console.log(`UID: ${user.uid}`);
    console.log('\nUser needs to refresh their token to see the new role.');
    console.log('In your app, you may need to log out and log back in.');
    
  } catch (error) {
    console.error('Error setting admin role:', error.message);
    process.exit(1);
  }
}

setAdminRole();
