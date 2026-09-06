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
          const emailLower = (currentUser.email || '').toLowerCase().trim();
          const isSpecialAdmin = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'].includes(emailLower);

          if (userSnap.exists()) {
            const data = userSnap.data();
            
            if (isSpecialAdmin) {
              // Promote to admin if not already admin
              if (data.role !== 'admin') {
                const updatedData = {
                  role: 'admin' as const,
                  balance: 0,
                  totalSpent: data.totalSpent || 0,
                  email: currentUser.email || '',
                  adminSecret: 'XVIRORISTHEBEST213',
                  updatedAt: Date.now()
                };
                setUserData(updatedData as UserData);
                setLoading(false);
                try {
                  await setDoc(userRef, { 
                    role: 'admin', 
                    adminSecret: 'XVIRORISTHEBEST213',
                    balance: 0,
                    updatedAt: Date.now() 
                  }, { merge: true });
                } catch (err) {
                  console.error("Firestore auto-promotion failed, but user is locally authenticated as admin:", err);
                }
              } else {
                setUserData(data as UserData);
                setLoading(false);
              }
            } else {
              // Non-admin email: Demote if role is admin
              if (data.role === 'admin') {
                const updatedData = {
                  role: 'user' as const,
                  balance: data.balance || 0,
                  totalSpent: data.totalSpent || 0,
                  email: currentUser.email || '',
                  updatedAt: Date.now()
                };
                setUserData(updatedData as UserData);
                setLoading(false);
                try {
                  await setDoc(userRef, { 
                    role: 'user',
                    updatedAt: Date.now() 
                  }, { merge: true });
                } catch (err) {
                  console.error("Firestore auto-demotion failed:", err);
                }
              } else {
                setUserData(data as UserData);
                setLoading(false);
              }
            }
          } else {
            const targetRole = isSpecialAdmin ? 'admin' : 'user';
            const newUserData: UserData = {
              role: targetRole,
              balance: 0,
              totalSpent: 0,
              email: currentUser.email || '',
            };
            
            setUserData(newUserData);
            setLoading(false);
            
            try {
              await setDoc(userRef, {
                ...newUserData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...(isSpecialAdmin ? { adminSecret: 'XVIRORISTHEBEST213' } : {})
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
    const isSpecialAdmin = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'].includes(email.toLowerCase().trim());
    
    // Normal email & password sign-in for everyone (as user requested: "And rest with the mail and password")
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);

    if (userCredential?.user) {
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : undefined,
        updatedAt: Date.now()
      }, { merge: true });
    }
  };

  const signUp = async (email: string, pass: string) => {
    const isSpecialAdmin = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'].includes(email.toLowerCase().trim());

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential?.user) {
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        role: isSpecialAdmin ? 'admin' : 'user',
        balance: 0,
        totalSpent: 0,
        email: email,
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
