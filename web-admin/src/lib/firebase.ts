import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBSzelPG5qJVQSmiLVdNA4d4kUYAmAJayo",
  authDomain: "adelclinic-35393.firebaseapp.com",
  projectId: "adelclinic-35393",
  storageBucket: "adelclinic-35393.firebasestorage.app",
  messagingSenderId: "282914238575",
  appId: "1:282914238575:web:f2f88d7a76c2e7aab25d9a",
  measurementId: "G-T53CFDQG7V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Emulators disabled - using production Firebase
// Uncomment below if you want to use Firebase emulators in development:
// if (import.meta.env.DEV) {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099');
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch (error) {
//     console.log('Emulators already connected');
//   }
// }

export default app;
