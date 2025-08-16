
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export interface IMember {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'Owner' | 'Editor' | 'Member';
}

export interface IWorkspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: Record<string, IMember>; // Using a map for easy access and security rules
  memberUids: Record<string, boolean>; // For array-contains queries
  createdAt: any;
}

export interface ITask {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: 'To-Do' | 'In Progress' | 'Done' | 'Backlog';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: any;
  assignee?: IMember | null;
  createdAt: any;
  createdBy: string;
}

// Function to create a new workspace
export const createWorkspace = async (
  name: string,
  description: string,
  owner: User
) => {
  const ownerMember: IMember = {
    uid: owner.uid,
    displayName: owner.displayName,
    email: owner.email,
    photoURL: owner.photoURL,
    role: 'Owner',
  };

  const newWorkspace = {
    name,
    description,
    ownerId: owner.uid,
    members: {
      [owner.uid]: ownerMember,
    },
    memberUids: {
        [owner.uid]: true,
    },
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'workspaces'), newWorkspace);
  return { id: docRef.id, ...newWorkspace };
};

// Function to create an invitation
export const createInvite = async (
    workspaceId: string,
    workspaceName: string,
    inviterName: string
  ) => {
    const inviteData = {
      workspaceId,
      workspaceName,
      invitedBy: inviterName,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'invites'), inviteData);
    return docRef.id;
  };

// Function to create a task
export const createTask = async (taskData: Omit<ITask, 'id' | 'createdAt'>) => {
    const newTask = {
        ...taskData,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    return { id: docRef.id, ...newTask };
}

// Function to update a task's status
export const updateTaskStatus = async (taskId: string, newStatus: ITask['status']) => {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
};

