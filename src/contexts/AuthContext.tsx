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
        const specialAdmins = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'];
        const userEmail = (currentUser.email || '').toLowerCase().trim();
        const isSpecialAdmin = specialAdmins.includes(userEmail);

        // Use onSnapshot for real-time fast sync
        const userRef = doc(db, 'users', currentUser.uid);
        if (unsubDoc) unsubDoc(); // clear any previous listener
        unsubDoc = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            const preservedBalance = typeof data.balance === 'number' ? data.balance : 0;
            const finalRole = isSpecialAdmin ? 'admin' : (data.role || 'user');
            const updatedData = {
              ...data,
              role: finalRole,
              balance: preservedBalance,
              totalSpent: data.totalSpent || 0,
              email: currentUser.email || '',
              adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : data.adminSecret,
              updatedAt: Date.now()
            };
            setUserData(updatedData as UserData);
            setLoading(false);
            if (data.role !== finalRole) {
              try {
                await setDoc(userRef, { 
                  role: finalRole, 
                  adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : data.adminSecret,
                  balance: preservedBalance,
                  updatedAt: Date.now() 
                }, { merge: true });
              } catch (err) {
                console.error("Firestore role sync failed:", err);
              }
            }
          } else {
            const finalRole = isSpecialAdmin ? 'admin' : 'user';
            const newUserData: UserData = {
              role: finalRole,
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
                adminSecret: isSpecialAdmin ? 'XVIRORISTHEBEST213' : undefined
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
    const specialAdmins = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'];
    const isSpecialAdmin = specialAdmins.includes(email.toLowerCase().trim());
    
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
    const specialAdmins = ['yourr.farhan@gmail.com', 'kalikastore.info@gmail.com'];
    const isSpecialAdmin = specialAdmins.includes(email.toLowerCase().trim());

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential?.user) {
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        role: isSpecialAdmin ? 'admin' : 'user',
        balance: 0,
        totalSpent: 0,
        email: email,
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
