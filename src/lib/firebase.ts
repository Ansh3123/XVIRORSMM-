import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXooONqnVoFMOzndgrvtaxhWZ-Kr_XTqc",
  authDomain: "xvirorsmm.firebaseapp.com",
  projectId: "xvirorsmm",
  storageBucket: "xvirorsmm.firebasestorage.app",
  messagingSenderId: "997139821126",
  appId: "1:997139821126:web:0597fc04788d6f030a5047",
  measurementId: "G-GJDQ8HE1M2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
