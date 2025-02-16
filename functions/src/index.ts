import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const createCustomToken = functions.https.onCall(async (data, context) => {
  try {
    const customToken = await admin.auth().createCustomToken(data.uid);
    return customToken;
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error creating custom token');
  }
}); 