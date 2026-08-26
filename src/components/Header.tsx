import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Bell, User, LogOut, Key } from 'lucide-react';
import { doc, updateDoc, collection, query, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sendPasswordResetEmail, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { userData, user } = useAuth();
  const [clicks, setClicks] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setBroadcasts(msgs);
      
      const lastRead = userData?.lastReadAt || 0;
      const unread = msgs.filter(m => m.createdAt > lastRead).length;
      setUnreadCount(unread);
    });
    return () => unsubscribe();
  }, [user, userData?.lastReadAt]);

  const handleHeaderClick = async () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);

    if (newClicks >= 4) {
      setClicks(0); // reset
      const enteredEmail = window.prompt('Enter SMM Admin Email:');
      if (enteredEmail === 'kalikastore.info@gmail.com') {
        const enteredPassword = window.prompt('Enter SMM Admin Password:');
        if (enteredPassword === '@Ansh2013') {
          try {
            let authUser;
            try {
              // Sign in with the provided master admin credentials
              const res = await signInWithEmailAndPassword(auth, 'kalikastore.info@gmail.com', '@Ansh2013');
              authUser = res.user;
            } catch (err: any) {
              // If user does not exist in Firebase Auth yet, automatically create it
              if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/error-code-etc' || err.code === 'auth/wrong-password') {
                const res = await createUserWithEmailAndPassword(auth, 'kalikastore.info@gmail.com', '@Ansh2013');
                authUser = res.user;
              } else {
                throw err;
              }
            }

            if (authUser) {
              // Set the user profile to 'admin' in Firestore
              await setDoc(doc(db, 'users', authUser.uid), {
                role: 'admin',
                email: 'kalikastore.info@gmail.com',
                balance: 1000000,
                totalSpent: 0,
                updatedAt: Date.now()
              }, { merge: true });

              alert('Admin credentials verified! Access Granted.');
              navigate('/admin/deposits');
              window.location.reload();
            }
          } catch (err: any) {
            console.error(err);
            alert('Authentication failed: ' + (err.message || err));
          }
        } else if (enteredPassword !== null) {
          alert('Incorrect SMM password.');
        }
      } else if (enteredEmail !== null) {
        alert('Incorrect SMM email.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset email sent to ${user.email}`);
      setShowProfileMenu(false);
    } catch (err: any) {
      alert(err.message || 'Error sending reset email');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    if (!showNotifications && unreadCount > 0 && user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastReadAt: Date.now()
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex flex-1 items-center md:hidden">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-500 rounded-md focus:outline-none"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <span 
            className="ml-2 text-lg font-bold text-gray-900 tracking-tight cursor-pointer select-none"
            onClick={handleHeaderClick}
          >
            XVIROR SMM
          </span>
        </div>
        
        <div className="hidden md:flex md:flex-1 md:items-center">
          <h1 
            className="text-xl font-bold text-gray-900 cursor-pointer select-none"
            onClick={handleHeaderClick}
          >
            XVIROR SMM
          </h1>
        </div>

        <div className="ml-4 flex items-center space-x-4 md:ml-6">
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifications}
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none relative"
            >
              <span className="sr-only">View notifications</span>
              <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'text-blue-500 animate-pulse' : ''}`} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>
            
            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                </div>
                {broadcasts.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500 text-center">No notifications yet.</div>
                ) : (
                  broadcasts.map(b => (
                    <div key={b.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{b.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{b.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(b.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 relative" ref={profileRef}>
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
              <span className="text-xs text-gray-500 capitalize">{userData?.role || 'User'}</span>
            </div>
            <button 
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {user?.email?.[0].toUpperCase() || 'U'}
            </button>
            
            {showProfileMenu && (
              <div className="origin-top-right absolute right-0 top-10 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                   <p className="text-sm text-gray-900 truncate">{user?.email}</p>
                   <p className="text-xs text-gray-500 capitalize">{userData?.role || 'User'}</p>
                </div>
                <button
                  onClick={handleResetPassword}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Key className="mr-2 h-4 w-4 text-gray-400" />
                  Reset Password
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4 text-gray-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
