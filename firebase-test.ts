import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase-server.js';

async function test() {
  try {
    const docRef = doc(db, 'botConfigs', 'master');
    const snap = await getDoc(docRef);
    console.log("Success! Data:", snap.exists() ? snap.data() : "No data");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
