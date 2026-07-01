import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyC4QOAHItUHT7JpEWZYQbF9XDsXcgIsKy0",
  authDomain: "triple-encoder-c79b0.firebaseapp.com",
  projectId: "triple-encoder-c79b0",
  storageBucket: "triple-encoder-c79b0.firebasestorage.app",
  messagingSenderId: "440088835914",
  appId: "1:440088835914:web:e1fca95531484558f1f3b3"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
// Use the custom firestoreDatabaseId from the configuration
export const db = getFirestore(app, "ai-studio-fleetanddocument-70bad2b4-855f-4de7-aeae-cea7fec1d45a");

// Validate connection on startup (as requested by skill rules)
export async function testFirestoreConnection() {
  try {
    // Attempt to read a dummy document to verify connection
    await getDocFromServer(doc(db, "test_connection", "ping"));
    console.log("Firestore connection test passed.");
  } catch (error) {
    console.warn("Firestore connection check info:", error);
  }
}

testFirestoreConnection();
