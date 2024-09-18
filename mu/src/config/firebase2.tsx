import { initializeApp } from "@firebase/app";
import { getStorage } from "@firebase/storage";

// Firebase configuration 
const firebaseConfig2 = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY_2,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN_2,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID_2,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET_2,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID_2,
  appId: process.env.NEXT_PUBLIC_APP_ID_2,
};

// Initialize firebase
const app2 = initializeApp(firebaseConfig2, "app2");
const storage2 = getStorage(app2);

export { storage2 };
