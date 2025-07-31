// // contexts/AuthContext.js
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../firebase';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [initializing, setInitializing] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       if (initializing) {
//         setInitializing(false);
//       }
//       setIsLoading(false);
//     });

//     // Cleanup subscription on unmount
//     return unsubscribe;
//   }, [initializing]);

//   const value = {
//     user,
//     isLoading,
//     initializing,
//     isAuthenticated: !!user,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import React, { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "../firebase";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [initializing, setInitializing] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
//       setUser(firebaseUser);
//       setInitializing(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, initializing }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);


// // contexts/AuthContext.js - ROBUST VERSION
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../firebase';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [initializing, setInitializing] = useState(true);
//   const [authChecked, setAuthChecked] = useState(false);

//   useEffect(() => {
//     console.log('🚀 Starting Firebase auth listener...');
    
//     // Set up timeout to prevent infinite loading
//     const timeoutId = setTimeout(() => {
//       if (initializing && !authChecked) {
//         console.log('⚠️ Auth check timeout - forcing initialization complete');
//         setInitializing(false);
//         setAuthChecked(true);
//       }
//     }, 5000); // 5 second timeout

//     // Manual check of current user (important for app restart)
//     const checkCurrentUser = () => {
//       console.log('🔍 Manual auth check - Current user:', auth.currentUser?.email || 'None');
//       if (auth.currentUser) {
//         setUser(auth.currentUser);
//       }
//       setAuthChecked(true);
//     };

//     // Check immediately
//     checkCurrentUser();

//     // Set up auth state listener
//     const unsubscribe = onAuthStateChanged(
//       auth, 
//       (user) => {
//         console.log('🔥 Auth state changed:', {
//           user: user ? { 
//             email: user.email, 
//             displayName: user.displayName, 
//             uid: user.uid,
//             emailVerified: user.emailVerified 
//           } : null,
//           wasInitializing: initializing,
//           authChecked
//         });
        
//         clearTimeout(timeoutId);
//         setUser(user);
//         setAuthChecked(true);
        
//         if (initializing) {
//           console.log('✅ Initialization complete via auth state change');
//           setInitializing(false);
//         }
//       },
//       (error) => {
//         console.error('❌ Auth state change error:', error);
//         clearTimeout(timeoutId);
//         setAuthChecked(true);
//         setInitializing(false);
//       }
//     );

//     // Additional check after a brief delay (helps with persistence loading)
//     const delayedCheck = setTimeout(() => {
//       if (!authChecked && auth.currentUser) {
//         console.log('🔄 Delayed auth check found user:', auth.currentUser.email);
//         setUser(auth.currentUser);
//         setAuthChecked(true);
//         setInitializing(false);
//       }
//     }, 1000);

//     return () => {
//       console.log('🧹 Cleaning up auth listener');
//       clearTimeout(timeoutId);
//       clearTimeout(delayedCheck);
//       unsubscribe();
//     };
//   }, []); // Remove dependencies to prevent re-initialization

//   const value = {
//     user,
//     initializing,
//     isAuthenticated: !!user,
//     authChecked,
//   };

//   console.log('📦 AuthContext value:', {
//     hasUser: !!user,
//     initializing,
//     isAuthenticated: !!user,
//     authChecked,
//     userEmail: user?.email
//   });

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { authStorage } from '../utils/authStorage';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Check for saved user on app start
//   useEffect(() => {
//     checkSavedUser();
//   }, []);

//   const checkSavedUser = async () => {
//     console.log('🔍 Checking for saved user...');
//     setIsLoading(true);
    
//     try {
//       const savedUser = await authStorage.getUser();
      
//       if (savedUser && authStorage.isSessionValid(savedUser)) {
//         console.log('✅ Valid user session found:', savedUser.email);
//         setUser(savedUser);
//       } else if (savedUser) {
//         console.log('⚠️ User session expired, clearing storage');
//         await authStorage.removeUser();
//       } else {
//         console.log('📱 No saved user found');
//       }
//     } catch (error) {
//       console.error('❌ Error checking saved user:', error);
//     } finally {
//       setIsLoading(false);
//       console.log('✅ Auth check complete');
//     }
//   };

//   const login = async (firebaseUser) => {
//     console.log('🔐 Logging in user:', firebaseUser.email);
    
//     // Save to AsyncStorage
//     await authStorage.saveUser(firebaseUser);
    
//     // Update state
//     setUser({
//       uid: firebaseUser.uid,
//       email: firebaseUser.email,
//       displayName: firebaseUser.displayName,
//       emailVerified: firebaseUser.emailVerified,
//       loginTime: Date.now()
//     });
//   };

//   const logout = async () => {
//     console.log('🚪 Logging out user');
    
//     // Remove from AsyncStorage
//     await authStorage.removeUser();
    
//     // Update state
//     setUser(null);
//   };

//   const value = {
//     user,
//     isLoading,
//     isAuthenticated: !!user,
//     login,
//     logout,
//     checkSavedUser, // Expose in case you need to refresh
//   };

//   console.log('📦 AuthContext state:', {
//     hasUser: !!user,
//     isLoading,
//     userEmail: user?.email || 'none'
//   });

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// context/AuthContext.js - COMPLETE FILE
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '../utils/authStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user on app start
  useEffect(() => {
    checkSavedUser();
  }, []);

  const checkSavedUser = async () => {
    console.log('🔍 Checking for saved user...');
    setIsLoading(true);
    
    try {
      const savedUser = await authStorage.getUser();
      
      if (savedUser && authStorage.isSessionValid(savedUser)) {
        console.log('✅ Valid user session found:', savedUser.email);
        setUser(savedUser);
      } else if (savedUser) {
        console.log('⚠️ User session expired, clearing storage');
        await authStorage.removeUser();
      } else {
        console.log('📱 No saved user found');
      }
    } catch (error) {
      console.error('❌ Error checking saved user:', error);
    } finally {
      setIsLoading(false);
      console.log('✅ Auth check complete');
    }
  };

  const login = async (firebaseUser) => {
    console.log('🔐 Logging in user:', firebaseUser.email);
    
    // Save to AsyncStorage
    await authStorage.saveUser(firebaseUser);
    
    // Update state
    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      emailVerified: firebaseUser.emailVerified,
      loginTime: Date.now()
    });
  };

  const logout = async () => {
    console.log('🚪 Logging out user');
    
    // Remove from AsyncStorage
    await authStorage.removeUser();
    
    // Update state
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkSavedUser, // Expose in case you need to refresh
  };

  console.log('📦 AuthContext state:', {
    hasUser: !!user,
    isLoading,
    userEmail: user?.email || 'none'
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};