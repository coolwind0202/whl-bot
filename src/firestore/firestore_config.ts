import * as admin from 'firebase-admin';
import { normalize } from '../utils/envs';
import dotenv from "dotenv";

dotenv.config();

const checkCanUseFirestore = () => {
    return process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL;
}

const canUseFirestore = checkCanUseFirestore();

if (admin.apps.length === 0 && canUseFirestore) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: normalize(process.env.FIREBASE_PROJECT_ID),
            privateKey: normalize(process.env.FIREBASE_PRIVATE_KEY),
            clientEmail: normalize(process.env.FIREBASE_CLIENT_EMAIL)
        })
    });
}

const db = canUseFirestore ? admin.firestore() : null;
const getDb = () => {
    return db;
}

export { getDb, checkCanUseFirestore };