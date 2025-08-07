
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// Write or Update User Data
export async function writeUserData(uid: string, data: Record<string, any>) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });
    console.log('✅ User data written.');
  } catch (err: any) {
    console.error('❌ Write failed:', err.message);
  }
}

// Read User Data
export async function readUserData(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('❌ No such document.');
      return null;
    }
  } catch (err: any) {
    console.error('❌ Read failed:', err.message);
  }
}

// Delete User Data
export async function deleteUserData(uid: string) {
  try {
    await deleteDoc(doc(db, 'users', uid));
    console.log('✅ Deleted user data.');
  } catch (err: any) {
    console.error('❌ Delete failed:', err.message);
  }
}
