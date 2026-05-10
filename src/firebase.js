import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCr0QjACxQDlcUIQ6BYD9pEXaIBatseYrs",
  authDomain: "jahs-site-progress.firebaseapp.com",
  projectId: "jahs-site-progress",
  storageBucket: "jahs-site-progress.firebasestorage.app",
  messagingSenderId: "812189901226",
  appId: "1:812189901226:web:f5da7f54aebe797c498bd3",
  measurementId: "G-CFL83SCPE4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);