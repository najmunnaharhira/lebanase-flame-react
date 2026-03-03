import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const fallbackFirebaseConfig = {
  apiKey: "AIzaSyA3Q5LOkRRyPI12Jg2guK3HMXxcibPx6jo",
  authDomain: "uk-restuart.firebaseapp.com",
  databaseURL: "https://uk-restuart-default-rtdb.firebaseio.com",
  projectId: "uk-restuart",
  storageBucket: "uk-restuart.firebasestorage.app",
  messagingSenderId: "900477608367",
  appId: "1:900477608367:web:1ca928365ffc4711bf4f5a",
  measurementId: "G-98F9RFC8QX",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL || fallbackFirebaseConfig.databaseURL,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    fallbackFirebaseConfig.measurementId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export let analytics: Analytics | null = null;

if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}
