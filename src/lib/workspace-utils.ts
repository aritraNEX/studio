
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

export interface IWorkspace {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    memberUids: { [uid: string]: boolean };
    createdAt: any;
}


// Function to create a new workspace
export const createWorkspace = async (name: string, description: string, user: User) => {
    const workspaceRef = await addDoc(collection(db, 'workspaces'), {
        name,
        description,
        ownerId: user.uid,
        memberUids: {
            [user.uid]: true
        },
        createdAt: serverTimestamp()
    });

    const memberData: IMember = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'admin'
    };
    await setDoc(doc(db, 'workspaces', workspaceRef.id, 'members', user.uid), memberData);
};


// Function to create an invite
export const createInvite = async (workspaceId: string, workspaceName: string, invitedBy: string) => {
    const inviteRef = await addDoc(collection(db, 'invites'), {
        workspaceId,
        workspaceName,
        invitedBy,
        createdAt: serverTimestamp()
    });
    return inviteRef.id;
};


// Function to get all members for a workspace
export const getWorkspaceMembers = async (workspaceId: string): Promise<IMember[]> => {
    const members: IMember[] = [];
    const membersRef = collection(db, 'workspaces', workspaceId, 'members');
    const snapshot = await getDocs(membersRef);
    snapshot.forEach(doc => {
        members.push(doc.data() as IMember);
    });
    return members;
}

// Function to create a task under the workspace subcollection
export const createTask = async (taskData: Omit<ITask, 'id' | 'createdAt'> & { workspaceId: string }) => {
    const { workspaceId, ...restOfTaskData } = taskData;
    const newTask = {
        ...restOfTaskData,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'workspaces', workspaceId, 'tasks'), newTask);
    return { id: docRef.id, ...newTask };
}

// Function to update a task's status under the workspace subcollection
export const updateTaskStatus = async (workspaceId: string, taskId: string, newStatus: ITask['status']) => {
    const taskRef = doc(db, 'workspaces', workspaceId, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
};

// Function to get all tasks for a workspace
export const getWorkspaceTasks = async (workspaceId: string): Promise<ITask[]> => {
    const tasksRef = collection(db, 'workspaces', workspaceId, 'tasks');
    const snapshot = await getDocs(tasksRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITask));
}
