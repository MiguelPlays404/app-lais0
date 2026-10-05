import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction } from '../types';

const COLLECTION_NAME = 'transactions';
const LOCAL_STORAGE_KEY = 'tiktok_sim_transactions_clean';

export function getCachedTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not read cached transactions:', e);
  }
  return [];
}

export function saveCachedTransactions(list: Transaction[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save cached transactions:', e);
  }
}

/**
 * Real-time subscription to transactions
 */
export function subscribeTransactions(
  onData: (txs: Transaction[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Transaction[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as Transaction);
        });
        saveCachedTransactions(items);
        onData(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot listener error, using local cache:', error);
        if (onError) onError(error);
        const cached = getCachedTransactions();
        onData(cached);
      }
    );
  } catch (err) {
    console.warn('Failed to attach Firestore listener:', err);
    const cached = getCachedTransactions();
    onData(cached);
    return () => {};
  }
}

/**
 * Create a new simulated transaction
 */
export async function createTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanUsername = tx.targetUsername.startsWith('@') 
    ? tx.targetUsername.trim() 
    : `@${tx.targetUsername.trim()}`;

  const newTx: Transaction = {
    ...tx,
    id,
    targetUsername: cleanUsername,
    coins: Number(tx.coins),
    usdRate: Number(tx.usdRate),
    totalUsd: Number(tx.totalUsd),
    status: tx.status || 'completed',
    createdAt: tx.createdAt || new Date().toISOString(),
  };

  // 1. Update cache immediately
  const current = getCachedTransactions();
  const updated = [newTx, ...current];
  saveCachedTransactions(updated);

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload = {
      targetUsername: newTx.targetUsername,
      coins: newTx.coins,
      usdRate: newTx.usdRate,
      totalUsd: newTx.totalUsd,
      status: newTx.status,
      createdAt: newTx.createdAt,
      ...(newTx.senderName ? { senderName: newTx.senderName } : {}),
      ...(newTx.note ? { note: newTx.note } : {}),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
  }

  return newTx;
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(id: string, status: Transaction['status']): Promise<void> {
  const current = getCachedTransactions();
  const updated = current.map(t => t.id === id ? { ...t, status } : t);
  saveCachedTransactions(updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const current = getCachedTransactions();
  const updated = current.filter(t => t.id !== id);
  saveCachedTransactions(updated);

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Clear all transactions (zero out database)
 */
export async function clearAllTransactions(): Promise<void> {
  saveCachedTransactions([]);
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (e) {
    console.warn('Error clearing Firestore collection:', e);
  }
}
