import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXooONqnVoFMOzndgrvtaxhWZ-Kr_XTqc",
  authDomain: "xvirorsmm.firebaseapp.com",
  projectId: "xvirorsmm",
  storageBucket: "xvirorsmm.firebasestorage.app",
  messagingSenderId: "997139821126",
  appId: "1:997139821126:web:c83142bfae1c71020a5047"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
