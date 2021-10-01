import * as admin from 'firebase-admin';
import dotenv from "dotenv";

dotenv.config();

const checkCanUseFirestore = () => {
    return process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL;
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.replace(/\\n/g, "\n")
        })
    });
}

const db = admin.firestore();
export { db, checkCanUseFirestore };