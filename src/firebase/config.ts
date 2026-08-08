import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const isFirebaseConfigured = typeof import.meta.env.VITE_FIREBASE_API_KEY === 'string' && 
  import.meta.env.VITE_FIREBASE_API_KEY.length > 0 && 
  import.meta.env.VITE_FIREBASE_API_KEY !== 'undefined';

let app: any;
let auth: any;
let db: any;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("Firebase VITE_FIREBASE_API_KEY is missing or undefined. Running in Local Demo Mode.");
  app = { isMock: true };
  auth = { isMock: true };
  db = { isMock: true };
}

export { auth, db };
export default app;