// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBQDG0k6m1sPIj7lnp9K4emwLXCV4WiA8",
  authDomain: "flashcards-d48a7.firebaseapp.com",
  projectId: "flashcards-d48a7",
  storageBucket: "flashcards-d48a7.firebasestorage.app",
  messagingSenderId: "41332853563",
  appId: "1:41332853563:web:9e5b48fccd80a69d6dc51e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
