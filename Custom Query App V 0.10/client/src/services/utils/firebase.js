import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import decodeEnv from "../../utils/Decode";

const firebaseConfig = {
  apiKey: decodeEnv(import.meta.env.VITE_API_KEY),
  authDomain: decodeEnv(import.meta.env.VITE_AUTHDOMAIN),
  databaseURL: decodeEnv(import.meta.env.VITE_DATABASEURL),
  projectId: decodeEnv(import.meta.env.VITE_PROJECTID),
  storageBucket: decodeEnv(import.meta.env.VITE_STORAGEBUCKET),
  messagingSenderId: decodeEnv(import.meta.env.VITE_MESSAGINGSENDERID),
  appId: decodeEnv(import.meta.env.VITE_APPID),
  measurementId: decodeEnv(import.meta.env.VITE_MEASUREMENTID),
};
// console.log("Firebase Config:", firebaseConfig);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { auth };
