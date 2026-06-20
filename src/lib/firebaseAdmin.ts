import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

// In production, the GOOGLE_APPLICATION_CREDENTIALS environment variable
// should be set to the path of your Firebase service account JSON key file.
// Or if running on a GCP/Firebase native environment (like Cloud Run), it automatically detects it.
export const initFirebaseAdmin = () => {
    if (!getApps().length) {
        initializeApp();
    }
    return getFirestore();
};
