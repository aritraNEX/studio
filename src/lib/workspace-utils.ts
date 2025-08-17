
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export interface IMember {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'editor' | 'member';
}

export interface IWorkspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
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
    role: 'admin',
  };

  const newWorkspace = {
    name,
    description,
    ownerId: owner.uid,
    memberUids: {
        [owner.uid]: true,
    },
    createdAt: serverTimestamp(),
  };

  const workspaceRef = await addDoc(collection(db, 'workspaces'), newWorkspace);

  // Add the owner to the members subcollection
  await setDoc(doc(db, 'workspaces', workspaceRef.id, 'members', owner.uid), ownerMember);

  return { id: workspaceRef.id, ...newWorkspace };
};

// Function to get all members of a workspace
export const getWorkspaceMembers = async (workspaceId: string): Promise<IMember[]> => {
    const membersRef = collection(db, 'workspaces', workspaceId, 'members');
    const snapshot = await getDocs(membersRef);
    return snapshot.docs.map(doc => doc.data() as IMember);
}

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
    const docRef = await addDoc(collection(db, 'workspaces', taskData.workspaceId, 'tasks'), newTask);
    return { id: docRef.id, ...newTask };
}

// Function to update a task's status
export const updateTaskStatus = async (workspaceId: string, taskId: string, newStatus: ITask['status']) => {
    const taskRef = doc(db, 'workspaces', workspaceId, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
};
