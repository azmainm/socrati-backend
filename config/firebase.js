import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let db;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  db = admin.firestore();
} else {
  db = admin.firestore();
}

export { admin, db };