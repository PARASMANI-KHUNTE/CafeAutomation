const dotenv = require('dotenv');
dotenv.config();
const admin = require('firebase-admin');
const path = require('path');


// Load the service account from the secret file path
// const serviceAccount = require(path.join(__dirname, `/etc/secrets/${process.env.SERVICE_ACCOUNT}`));
const serviceAccount =`/etc/secrets/${process.env.SERVICE_ACCOUNT}`;

if (!process.env.storageBucket) {
    console.error('Firebase storage bucket not configured. Please set storageBucket in .env file');
    process.exit(1);
}

// Clean the storage bucket name by removing any quotes, commas, or extra spaces
const storageBucket = process.env.storageBucket.replace(/["',\s]/g, '');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucket,
});

const bucket = admin.storage().bucket();

module.exports = bucket;