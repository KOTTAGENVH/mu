import { initializeApp } from "@firebase/app";
import { getStorage } from "@firebase/storage";

// Firebase configuration
const firebaseConfig4 = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY_4,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN_4,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID_4,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET_4,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID_4,
  appId: process.env.NEXT_PUBLIC_APP_ID_4,
};

// Initialize Firebase
const app4 = initializeApp(firebaseConfig4, "app4");
const storage4 = getStorage(app4);

export { storage4 };
