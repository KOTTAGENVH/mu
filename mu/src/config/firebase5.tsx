import { initializeApp } from "@firebase/app";
import { getStorage } from "@firebase/storage";

// Firebase configuration
const firebaseConfig5 = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY_5,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN_5,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID_5,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET_5,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID_5,
  appId: process.env.NEXT_PUBLIC_APP_ID_5,
};

// Initialize Firebase
const app5 = initializeApp(firebaseConfig5, "app5");
const storage5 = getStorage(app5);

export { storage5 };
