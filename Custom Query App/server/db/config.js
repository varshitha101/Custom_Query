/**
 * @file config.js
 * @description
 * Initializes and exports Firebase app, authentication, Realtime Database, and Firestore instances
 * using environment variables for configuration. This module loads environment variables,
 * sets up the Firebase configuration, and provides initialized Firebase services for use in the server.
 *
 * Exports:
 *   - app: The initialized Firebase app instance.
 *   - auth: The Firebase Authentication instance.
 *   - database: The Firebase Realtime Database instance.
 *   - db: The Firebase Firestore instance.
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTHDOMAIN,
  databaseURL: process.env.VITE_DATABASEURL,
  projectId: process.env.VITE_PROJECTID,
  storageBucket: process.env.VITE_STORAGEBUCKET,
  messagingSenderId: process.env.VITE_MESSAGINGSENDERID,
  appId: process.env.VITE_APPID,
  measurementId: process.env.VITE_MEASUREMENTID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

export { auth, database, db, app };
