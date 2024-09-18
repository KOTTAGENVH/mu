import { initializeApp } from "@firebase/app";
import { getStorage } from "@firebase/storage";

// Firebase configuration
const firebaseConfig3 = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY_3,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN_3,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID_3,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET_3,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID_3,
  appId: process.env.NEXT_PUBLIC_APP_ID_3,
};

// Initialize Firebase
const app3 = initializeApp(firebaseConfig3, "app3");
const storage3 = getStorage(app3);

export { storage3 };
