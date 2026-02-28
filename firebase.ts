import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Prefer env vars (Vite exposes only VITE_* to the client).
// Fallbacks below match your Firebase web config so the app runs immediately.
// Recommended: move these to `.env.local` and remove the fallbacks before publishing.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDall6F5oa0zo541kYENjTLpcSvBxtWsJ4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'iron-progress-e79b5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'iron-progress-e79b5',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'iron-progress-e79b5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '337840068277',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:337840068277:web:30c989965e2c1f945a90fc',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });


