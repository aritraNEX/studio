
'use server';

import {getAuth, Auth} from 'firebase-admin/auth';
import {getFirestore, Firestore} from 'firebase-admin/firestore';
import {initializeApp, getApps, cert, App} from 'firebase-admin/app';

let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    adminAuth = getAuth();
    adminDb = getFirestore();
  } else {
    console.warn("Firebase Admin SDK service account key not found. Trial tracking will be disabled.");
  }
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
}


export async function setTrialUsed(uid: string) {
    if (!adminDb) {
        console.log("Admin DB not initialized, skipping trial update.");
        return;
    }
    try {
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.update({ hasUsedTrial: true });
        console.log(`Trial status updated for user: ${uid}`);
    } catch (error) {
        console.error("Failed to update user trial status:", error);
    }
}

export {adminAuth, adminDb};
