import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId);
  } catch (error) {
    console.warn("Failed to initialize Firebase client SDK on server:", error);
  }
}

export { db, doc, setDoc, getDoc };
