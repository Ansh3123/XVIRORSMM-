import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup
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
        unsubDoc = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            setUserData(userSnap.data() as UserData);
            setLoading(false);
          } else {
            const newUserData: UserData = {
              role: 'user',
              balance: 0,
              totalSpent: 0,
              email: currentUser.email || '',
            };
            
            setDoc(userRef, {
              ...newUserData,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }).then(() => {
              setUserData(newUserData);
              setLoading(false);
            }).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            });
          }
        }, (error) => {
           console.error("Error fetching user data:", error);
           setLoading(false);
           handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });
        
        // We could store the unsubDoc to clean it up when auth state changes, 
        // but for simplicity it runs until the next auth state change where we can clear it.
        // Actually, we should clear it if we unsubscribe from auth or if the user logs out.
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
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
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
