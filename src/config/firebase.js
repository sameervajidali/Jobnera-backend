// src/config/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const serviceAccount = JSON.parse(
  readFileSync(path.join(process.cwd(), 'firebase-service-account.json'))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'jobneura-uploads.appspot.com',
});

export const bucket = admin.storage().bucket();
