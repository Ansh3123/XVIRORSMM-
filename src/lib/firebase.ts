import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2__f4u4yLdk1hyj51ePnGREpViW_3LB4",
  authDomain: "xvirorsmm.firebaseapp.com",
  projectId: "xvirorsmm",
  storageBucket: "xvirorsmm.appspot.com",
  messagingSenderId: "899506991316",
  appId: "1:899506991316:web:567035ba4944e975628b41"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
