import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase web config is public by design (same project as rytc-behavior-score).
// Access control happens through Firestore/Storage Security Rules + Firebase Auth,
// not by hiding this config.
const firebaseConfig = {
  apiKey: 'AIzaSyBUgTbS3jy-SN4Ayw4Xj8WWgfmTuPG3MDo',
  authDomain: 'rytc-app.firebaseapp.com',
  projectId: 'rytc-app',
  storageBucket: 'rytc-app.firebasestorage.app',
  messagingSenderId: '660036117392',
  appId: '1:660036117392:web:46556419dc91455cbb4915',
  measurementId: 'G-PTT6W05ZF0',
}

export const app = initializeApp(firebaseConfig)

// The `rytc-app` project hosts multiple apps' data in separate named Firestore
// databases. This app owns "fixit" — do not read/write any other database from here.
export const db = getFirestore(app, 'fixit')
export const auth = getAuth(app)
export const storage = getStorage(app)
