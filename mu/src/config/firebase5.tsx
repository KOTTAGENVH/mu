import { initializeApp } from "@firebase/app";
import { getStorage } from "@firebase/storage";

// Firebase configuration
const firebaseConfig5 = {
  apiKey: process.env.API_KEY_5,
  authDomain: process.env.AUTH_DOMAIN_5,
  projectId: process.env.PROJECT_ID_5,
  storageBucket: process.env.PUBLIC_PROJECT_ID_5,
  messagingSenderId: process.env.MESSAGING_SENDER_ID_5,
  appId: process.env.APP_ID_5,
};

// Initialize Firebase
const app5 = initializeApp(firebaseConfig5, "app5");
const storage5 = getStorage(app5);

export { storage5 };
