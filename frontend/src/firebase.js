import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBRg-sudEFEzDioPzTuSR9GMHZjNjzmDhY",
  authDomain: "chart-ef47b.firebaseapp.com",
  projectId: "chart-ef47b",
  storageBucket: "chart-ef47b.firebasestorage.app",
  messagingSenderId: "507040426756",
  appId: "1:507040426756:web:1d02af832ad87b30edbe51",
  measurementId: "G-KYE19V74SF",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
