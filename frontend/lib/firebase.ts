import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Only initialize on the client side
let app: FirebaseApp
let auth: Auth
let googleProvider: GoogleAuthProvider

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  // Persist session in localStorage — survives browser restarts, lasts until explicit logout
  import("firebase/auth").then(({ browserLocalPersistence, setPersistence }) => {
    setPersistence(auth, browserLocalPersistence)
  })
  googleProvider = new GoogleAuthProvider()
}

export { auth, googleProvider }
