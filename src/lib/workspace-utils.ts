
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
  orderBy
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

export interface IMessage {
    id: string;
    text: string;
    createdAt: any;
    sender: {
        uid: string;
        displayName: string | null;
        photoURL: string | null;
    }
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

// Function to create a task under the USER's subcollection
export const createTask = async (taskData: Omit<ITask, 'id' | 'createdAt'> & { userId: string }) => {
    const { userId, ...restOfTaskData } = taskData;
    const newTask = {
        ...restOfTaskData,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'users', userId, 'tasks'), newTask);
    return { id: docRef.id, ...newTask };
}

// Function to update a task's status under the USER's subcollection
export const updateTaskStatus = async (userId: string, taskId: string, newStatus: ITask['status']) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, { status: newStatus });
};

// Function to send a message to a workspace
export const sendMessage = async (workspaceId: string, text: string, user: User) => {
    await addDoc(collection(db, 'workspaces', workspaceId, 'messages'), {
        text,
        createdAt: serverTimestamp(),
        sender: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
        }
    });
};

// Function to get all messages for a workspace
export const getWorkspaceMessages = async (workspaceId: string): Promise<IMessage[]> => {
    const messagesRef = collection(db, 'workspaces', workspaceId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IMessage));
};
