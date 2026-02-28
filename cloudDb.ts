import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { WorkoutSession } from './types';

const sessionsCollection = (uid: string) => collection(firestore, 'users', uid, 'sessions');
const sessionDoc = (uid: string, sessionId: string) => doc(firestore, 'users', uid, 'sessions', sessionId);

export const cloudDb = {
  subscribeSessions: (uid: string, onChange: (sessions: WorkoutSession[]) => void) => {
    const q = query(sessionsCollection(uid), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      const sessions = snap.docs.map((d) => d.data() as WorkoutSession);
      onChange(sessions);
    });
  },

  saveSession: async (uid: string, session: WorkoutSession) => {
    // Use session.id as Firestore doc id for easy updates/deletes.
    await setDoc(sessionDoc(uid, session.id), session, { merge: false });
  },

  updateSession: async (uid: string, session: WorkoutSession) => {
    await setDoc(sessionDoc(uid, session.id), session, { merge: true });
  },

  deleteSession: async (uid: string, sessionId: string) => {
    await deleteDoc(sessionDoc(uid, sessionId));
  },
};


