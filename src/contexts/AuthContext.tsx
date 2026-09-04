import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';

interface UserData {
  role: 'user' | 'admin';
  balance: number;
  totalSpent: number;
  email: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (e: string, p: string) => Promise<void>;
  signUp: (e: string, p: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setLoading(true);
        setUser(currentUser);
        // Use onSnapshot for real-time fast sync
        const userRef = doc(db, 'users', currentUser.uid);
        if (unsubDoc) unsubDoc(); // clear any previous listener
        unsubDoc = onSnapshot(userRef, async (userSnap) => {
          const isSpecialAdmin = currentUser.email?.toLowerCase().trim() === 'isanshcool@gmail.com';
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            // Strict check: if the user is isanshcool@gmail.com, we must enforce role: admin and balance: 0 (not unlimited)
            if (isSpecialAdmin && (data.role !== 'admin' || data.balance !== 0)) {
              const updatedData = {
                role: 'admin' as const,
                balance: 0,
                email: currentUser.email || '',
                totalSpent: data.totalSpent || 0,
                adminSecret: 'XVIRORISTHEBEST213',
                updatedAt: Date.now()
              };
              setUserData(updatedData as UserData);
              setLoading(false);
              try {
                await setDoc(userRef, updatedData, { merge: true });
              } catch (err) {
                console.error("Firestore self-promotion failed, but user is locally authenticated as admin:", err);
              }
            } else {
              setUserData(data as UserData);
              setLoading(false);
            }
          } else {
            const newUserData: UserData = {
              role: isSpecialAdmin ? 'admin' : 'user',
              balance: 0,
              totalSpent: 0,
              email: currentUser.email || '',
            };
            
            setUserData(newUserData);
            setLoading(false);
            
            try {
              await setDoc(userRef, {
                ...newUserData,
                adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : undefined,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            } catch (err) {
              console.error("Firestore user creation failed:", err);
            }
          }
        }, (error) => {
           console.error("Error fetching user data:", error);
           setLoading(false);
           handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });
      } else {
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = undefined;
        }
        setUser(null);
        setUserData(null);
        setLoading(false); // Immediate unblock for unauthenticated users
      }
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    const isSpecialAdmin = email.toLowerCase().trim() === 'isanshcool@gmail.com';
    const targetPass = isSpecialAdmin ? '@Ansh2012' : pass;

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, targetPass);
    } catch (err: any) {
      // If the admin user is not registered yet or wrong password, auto-create/fix for the admin
      if (isSpecialAdmin && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password')) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, email, targetPass);
        } catch (createErr) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (userCredential?.user) {
      // Store/Backup password securely in user document for recovery requests
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        password: targetPass,
        adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : undefined,
        updatedAt: Date.now()
      }, { merge: true });
    }
  };

  const signUp = async (email: string, pass: string) => {
    const isSpecialAdmin = email.toLowerCase().trim() === 'isanshcool@gmail.com';
    const targetPass = isSpecialAdmin ? '@Ansh2012' : pass;

    const userCredential = await createUserWithEmailAndPassword(auth, email, targetPass);
    if (userCredential?.user) {
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        role: isSpecialAdmin ? 'admin' : 'user',
        balance: 0,
        totalSpent: 0,
        email: email,
        password: targetPass,
        adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
