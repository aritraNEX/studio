
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {initializeApp, getApps, cert} from 'firebase-admin/app';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount!),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export async function setTrialUsed(uid: string) {
    try {
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.update({ hasUsedTrial: true });
        console.log(`Trial status updated for user: ${uid}`);
    } catch (error) {
        console.error("Failed to update user trial status:", error);
        // We don't re-throw the error to avoid blocking the AI flow
    }
}

export {adminAuth, adminDb};
