import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-R9HItPKgN-01jBRzwxbWjg0cLoz6ezs",
  authDomain: "friendly-match-finder-2ff7a.firebaseapp.com",
  projectId: "friendly-match-finder-2ff7a",
  storageBucket: "friendly-match-finder-2ff7a.firebasestorage.app",
  messagingSenderId: "183831327109",
  appId: "1:183831327109:web:93b26a2bab903177ea14ec",
  measurementId: "G-Z9TYVNPFLG",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
