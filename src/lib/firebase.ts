import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5BDRA53v7U7eJBhe4Rpj2vsPkym3XgIc",
  authDomain: "spa-application-1757e.firebaseapp.com",
  projectId: "spa-application-1757e",
  storageBucket: "spa-application-1757e.firebasestorage.app",
  messagingSenderId: "122054698247",
  appId: "1:122054698247:web:558d61f308db1c174911a2",
  measurementId: "G-ZTND6MSJX0"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
