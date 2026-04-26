import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, Timestamp, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyBpl6tdmrB1dppYmfJQDqD5hxXJDiJ_rs8",
  authDomain: "fuelgestangola.firebaseapp.com",
  projectId: "fuelgestangola",
  storageBucket: "fuelgestangola.firebasestorage.app",
  messagingSenderId: "268892288681",
  appId: "1:268892288681:web:df7ac78ea72de649b8dbb8",
  measurementId: "G-1FWDN818XQ"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const isDemo = () => !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY";

export async function getCompanyData(companyId) {
  if (isDemo()) {
    const companies = JSON.parse(localStorage.getItem('demo_companies') || '[]');
    return companies.find(c => c.id === companyId) || null;
  }
  const snap = await getDoc(doc(db, 'companies', companyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserProfile(uid) {
  if (isDemo()) {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    return users.find(u => u.id === uid) || null;
  }
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function col(path) {
  if (isDemo()) {
    return JSON.parse(localStorage.getItem('demo_' + path.replace(/\//g, '_')) || '[]');
  }
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Error loading collection:", path, e);
    return [];
  }
}

export async function addItem(path, data, companyId, userId, actionLabel) {
  if (isDemo()) {
    const list = JSON.parse(localStorage.getItem('demo_' + path.replace(/\//g, '_')) || '[]');
    const newItem = { ...data, id: 'demo_' + Date.now(), createdAt: new Date() };
    list.push(newItem);
    localStorage.setItem('demo_' + path.replace(/\//g, '_'), JSON.stringify(list));
    if (companyId && actionLabel) await logAudit(companyId, userId, actionLabel, data);
    return newItem;
  }
  const res = await addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
  if (companyId && actionLabel) await logAudit(companyId, userId, actionLabel, data);
  return res;
}

export async function updateItem(path, data, companyId, userId, actionLabel) {
  if (isDemo()) {
    const parts = path.split('/');
    const id = parts.pop();
    const collPath = parts.join('_');
    const list = JSON.parse(localStorage.getItem('demo_companies_' + collPath) || '[]');
    const idx = list.findIndex(x => x.id === id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date() };
      localStorage.setItem('demo_companies_' + collPath, JSON.stringify(list));
    }
    if (companyId && actionLabel) await logAudit(companyId, userId, actionLabel, data);
    return;
  }
  await updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() });
  if (companyId && actionLabel) await logAudit(companyId, userId, actionLabel, data);
}

export async function deleteItem(path, companyId, userId, actionLabel) {
  if (isDemo()) {
    const parts = path.split('/');
    const id = parts.pop();
    const collPath = parts.join('_');
    let list = JSON.parse(localStorage.getItem('demo_companies_' + collPath) || '[]');
    list = list.filter(x => x.id !== id);
    localStorage.setItem('demo_companies_' + collPath, JSON.stringify(list));
    if (companyId && actionLabel) await logAudit(companyId, userId, actionLabel, { deletedId: id });
    return;
  }
  await deleteDoc(doc(db, path));
  if (companyId && actionLabel) await logAudit(companyId, userId, actionLabel, { deletedId: path });
}

export async function logAudit(companyId, userId, action, details) {
  try {
    const data = { userId, action, details, timestamp: new Date() };
    if (isDemo()) {
      const list = JSON.parse(localStorage.getItem(`demo_companies_${companyId}_audit`) || '[]');
      list.push({ ...data, id: 'log_' + Date.now() });
      localStorage.setItem(`demo_companies_${companyId}_audit`, JSON.stringify(list));
      return;
    }
    await addDoc(collection(db, `companies/${companyId}/audit`), { ...data, timestamp: serverTimestamp() });
  } catch (e) { console.warn("Audit log failed", e); }
}

export { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword, onAuthStateChanged, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, Timestamp, onSnapshot, serverTimestamp };
