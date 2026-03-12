import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA3Q5LOkRRyPI12Jg2guK3HMXxcibPx6jo",
  authDomain: "uk-restuart.firebaseapp.com",
  databaseURL: "https://uk-restuart-default-rtdb.firebaseio.com",
  projectId: "uk-restuart",
  storageBucket: "uk-restuart.firebasestorage.app",
  messagingSenderId: "900477608367",
  appId: "1:900477608367:web:1ca928365ffc4711bf4f5a",
  measurementId: "G-98F9RFC8QX"
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
