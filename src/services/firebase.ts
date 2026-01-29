// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Usa variáveis de ambiente se existirem (.env ou no deploy); senão usa fallback para rodar local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyB8YI1B8CD84SLlHwnE-QuHVeTvdyBkqRU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "bd-visaoall.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "bd-visaoall",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "bd-visaoall.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "665405861807",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:665405861807:web:9ce584bb7642092bb2095a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-TX5BLDPN63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);