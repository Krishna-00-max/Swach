import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-_MzJpCtFrzeli0m5Yd5CqD0A7_LeeVw",
  authDomain: "swacch-surveillance.firebaseapp.com",
  projectId: "swacch-surveillance",
  storageBucket: "swacch-surveillance.firebasestorage.app",
  messagingSenderId: "553417756156",
  appId: "1:553417756156:web:19f865f36fc6e291d47679",
  measurementId: "G-PF85B955FK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('[FCM] Messaging not supported:', e.message);
}

export const requestFCMPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
      });
      return token;
    }
  } catch (e) {
    console.warn('[FCM] Token error:', e.message);
  }
  return null;
};

export const onFCMMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export { app, messaging, auth };
