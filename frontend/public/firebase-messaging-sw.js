// Firebase Messaging Service Worker for background FCM notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA-_MzJpCtFrzeli0m5Yd5CqD0A7_LeeVw",
  authDomain: "swacch-surveillance.firebaseapp.com",
  projectId: "swacch-surveillance",
  storageBucket: "swacch-surveillance.firebasestorage.app",
  messagingSenderId: "553417756156",
  appId: "1:553417756156:web:19f865f36fc6e291d47679"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Swachh Surveillance', {
    body: body || 'New notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'swachh-notification',
    data: payload.data,
    actions: [
      { action: 'view', title: '📊 View Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    clients.openWindow('/');
  }
});
