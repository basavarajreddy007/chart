import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useDispatch } from 'react-redux';
import { loginSuccess, logoutSuccess } from '../features/authSlice';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const exchangeFirebaseToken = async (firebaseUserObj) => {
    const idToken = await firebaseUserObj.getIdToken();
    const response = await api.post('/auth/firebase-login', { idToken });
    const { accessToken, user } = response.data;
    dispatch(loginSuccess({ user, token: accessToken }));
    connectSocket(accessToken);
    return user;
  };

  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = await exchangeFirebaseToken(result.user);
    return user;
  };

  const forgotPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    disconnectSocket();
    dispatch(logoutSuccess());
    await signOut(auth);
  };

  const value = {
    firebaseUser,
    authLoading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    forgotPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
