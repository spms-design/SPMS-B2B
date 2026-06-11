import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';

const LOCAL_STORAGE_KEY = 'spms-portal-data';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firestoreCollection = import.meta.env.VITE_FIREBASE_COLLECTION || 'spms_portal';
const portalDocId = import.meta.env.VITE_FIREBASE_PORTAL_DOC_ID || 'main';
const appsScriptWebAppUrl = import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL;

let firebaseApp;
let firestoreDb;
let firebaseStorage;

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const hasStorageConfig = Boolean(hasFirebaseConfig && firebaseConfig.storageBucket);

const getFirebaseApp = () => {
  if (!hasFirebaseConfig) return null;
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }
  return firebaseApp;
};

const getFirestoreDb = () => {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!firestoreDb) {
    firestoreDb = getFirestore(app);
  }
  return firestoreDb;
};

const getFirebaseStorage = () => {
  const app = getFirebaseApp();
  if (!app || !hasStorageConfig) return null;
  if (!firebaseStorage) {
    firebaseStorage = getStorage(app);
  }
  return firebaseStorage;
};

const getPortalDocumentRef = () => {
  const db = getFirestoreDb();
  if (!db) return null;
  return doc(db, firestoreCollection, portalDocId);
};

const sanitizePortalData = (data = {}) => ({
  vendors: Array.isArray(data.vendors) ? data.vendors : [],
  requests: Array.isArray(data.requests) ? data.requests : []
});

const readLocalPortalData = () => {
  try {
    const rawData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return rawData ? sanitizePortalData(JSON.parse(rawData)) : sanitizePortalData();
  } catch (error) {
    console.warn('Unable to read local portal data.', error);
    return sanitizePortalData();
  }
};

const writeLocalPortalData = (data) => {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitizePortalData(data)));
  } catch (error) {
    console.warn('Unable to save local portal data.', error);
  }
};

const backupToAppsScript = (data) => {
  if (!appsScriptWebAppUrl) return;

  const payload = {
    type: 'portal_snapshot',
    source: 'spms-sourcing-portal',
    timestamp: new Date().toISOString(),
    ...sanitizePortalData(data)
  };

  fetch(appsScriptWebAppUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  }).catch((error) => {
    console.warn('Unable to send Apps Script backup.', error);
  });
};

export const isRealtimeConfigured = () => Boolean(getPortalDocumentRef());

export const subscribePortalData = (onData, onError) => {
  const portalDocumentRef = getPortalDocumentRef();

  if (!portalDocumentRef) {
    onData(readLocalPortalData());
    return () => {};
  }

  return onSnapshot(
    portalDocumentRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(readLocalPortalData());
        return;
      }
      const remoteData = sanitizePortalData(snapshot.data());
      writeLocalPortalData(remoteData);
      onData(remoteData);
    },
    (error) => {
      console.warn('Unable to subscribe to Firebase data.', error);
      onError?.(error);
      onData(readLocalPortalData());
    }
  );
};

export const savePortalData = async (data) => {
  const cleanData = sanitizePortalData(data);
  writeLocalPortalData(cleanData);
  backupToAppsScript(cleanData);

  const portalDocumentRef = getPortalDocumentRef();
  if (!portalDocumentRef) return;

  await setDoc(
    portalDocumentRef,
    {
      ...cleanData,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    image.src = objectUrl;
  });

export const fileToOptimizedDataUrl = async (file) => {
  try {
    const image = await loadImageElement(file);
    const maxDimension = 1280;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.72);
  } catch (error) {
    console.warn('Unable to optimize image, falling back to raw data URL.', error);
    return fileToDataUrl(file);
  }
};

export const uploadPortalImage = async (file) => {
  const storage = getFirebaseStorage();
  if (!storage) {
    return fileToOptimizedDataUrl(file);
  }

  const extension = file.name?.split('.').pop() || 'jpg';
  const randomId =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const imageRef = storageRef(storage, `portal-images/${randomId}.${extension}`);

  try {
    await uploadBytes(imageRef, file, {
      contentType: file.type || 'application/octet-stream'
    });
  } catch (error) {
    console.warn('Unable to upload to Firebase Storage, falling back to embedded image.', error);
    return fileToOptimizedDataUrl(file);
  }

  try {
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.warn('Unable to obtain Firebase Storage URL, falling back to embedded image.', error);
    return fileToOptimizedDataUrl(file);
  }
};
