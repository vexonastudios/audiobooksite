/**
 * lib/firebase/admin.ts
 *
 * Server-side Firebase Admin SDK singleton.
 * Used by all API routes that send push notifications.
 */
import admin from 'firebase-admin';

let initialized = false;

function getAdminApp() {
  if (!initialized) {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID is not set in environment variables');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID?.replace(/^["']|["']$/g, '').trim(),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.replace(/^["']|["']$/g, '').trim(),
        // Vercel stores multi-line env vars with literal \n — replace with actual newlines.
        // Also defensively strip any wrapping quotes if the user pasted them by accident.
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ?.replace(/^["']|["']$/g, '')
          ?.replace(/\\n/g, '\n'),
      }),
    });
    initialized = true;
  }
  return admin;
}

export interface PushPayload {
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
}

/**
 * Send a push notification to all users subscribed to a topic.
 * Returns the FCM message ID on success.
 */
export async function sendPushToTopic(
  topic: string,
  payload: PushPayload,
): Promise<string> {
  const app = getAdminApp();
  const messageId = await app.messaging().send({
    topic,
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
    },
    data: {
      link: payload.link || '/',
      title: payload.title,
      body: payload.body,
    },
    // Web / PWA specific options
    webpush: {
      notification: {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
      },
      fcmOptions: {
        link: payload.link || '/',
      },
    },
    // Android native options
    android: {
      notification: {
        icon: 'notification_icon',
        color: '#5B4CF5',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    // iOS native options
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  });

  return messageId;
}

/**
 * Subscribe an FCM token to a topic (server-side).
 */
export async function subscribeTokenToTopic(token: string, topic: string) {
  const app = getAdminApp();
  return app.messaging().subscribeToTopic(token, topic);
}

/**
 * Unsubscribe an FCM token from a topic (server-side).
 */
export async function unsubscribeTokenFromTopic(token: string, topic: string) {
  const app = getAdminApp();
  return app.messaging().unsubscribeFromTopic(token, topic);
}
