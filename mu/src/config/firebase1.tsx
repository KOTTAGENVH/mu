import { initializeApp } from "@firebase/app";
import { getStorage } from "@firebase/storage";

// Firebase configuration
const firebaseConfig1 = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY_1,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN_1,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID_1,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET_1,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID_1,
  appId: process.env.NEXT_PUBLIC_APP_ID_1,
};

// Initialize Firebase
const app1 = initializeApp(firebaseConfig1);
const storage1 = getStorage(app1);

export { storage1 };
