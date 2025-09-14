import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDAKIRLIGQYjBEjxuFp3Sr3uS8CGS3ldHg",
  authDomain: "expotools-47221.firebaseapp.com",
  databaseURL: "https://expotools-47221-default-rtdb.firebaseio.com",
  projectId: "expotools-47221",
  storageBucket: "expotools-47221.appspot.com",
  messagingSenderId: "387954696866",
  appId: "1:387954696866:web:1e3b8ff25d9b53558cedfb",
  measurementId: "G-JQ6MNC3HR9",
}

// Initialize Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
