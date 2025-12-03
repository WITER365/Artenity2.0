// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA51K3DkEB79DWfHwJ_lHgYB7juK0_kj0w",
  authDomain: "artenity-5127c.firebaseapp.com",
  projectId: "artenity-5127c",
  storageBucket: "artenity-5127c.firebasestorage.app",
  messagingSenderId: "124115018656",
  appId: "1:124115018656:web:9d3ae14dbbcb86ea94bac5",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ------------------------------
//  LOGIN GOOGLE
// ------------------------------
export const loginWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

// ------------------------------
//  LOGIN FACEBOOK
// ------------------------------
export const loginWithFacebook = async () => {
  return await signInWithPopup(auth, facebookProvider);
};
