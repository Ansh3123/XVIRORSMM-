import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2__f4u4yLdk1hyj51ePnGREpViW_3LB4",
  authDomain: "concrete-spider-c46tg.firebaseapp.com",
  projectId: "concrete-spider-c46tg",
  storageBucket: "concrete-spider-c46tg.firebasestorage.app",
  messagingSenderId: "899506991316",
  appId: "1:899506991316:web:567035ba4944e975628b41"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-xvirorsmm-89cfb5b2-20c3-4009-9bf0-87f06b86fdc6");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
