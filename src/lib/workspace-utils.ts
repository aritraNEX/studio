
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDocs,
  getDoc,
  query,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export interface IMember {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'member';
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: 'To-Do' | 'In Progress' | 'Done' | 'Backlog';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: any;
  assignee?: IMember | null;
  createdAt: any;
  createdBy: string;
}

// Function to get all members (now just the user themselves)
export const getWorkspaceMembers = async (userId: string): Promise<IMember[]> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return [{
            uid: userId,
            displayName: userData.displayName || 'User',
            email: userData.email,
            photoURL: userData.photoURL,
            role: 'admin'
        }];
    }
    return [];
}

// Function to create a task under the user's own document
export const createTask = async (taskData: Omit<ITask, 'id' | 'createdAt'> & { userId: string }) => {
    const { userId, ...restOfTaskData } = taskData;
    const newTask = {
        ...restOfTaskData,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'users', userId, 'tasks'), newTask);
    return { id: docRef.id, ...newTask };
}

// Function to update a task's status under the user's own document
export const updateTaskStatus = async (userId: string, taskId: string, newStatus: ITask['status']) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
};

// Function to get all tasks for a user
export const getUserTasks = async (userId: string): Promise<ITask[]> => {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const snapshot = await getDocs(tasksRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITask));
}
