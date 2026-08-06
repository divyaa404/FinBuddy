import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import type { Split, Participant, SplitItem } from '../types';

// Create a new split bill session
export async function createSplit(
  ownerId: string,
  ownerName: string,
  totalAmount: number,
  mode: 'even' | 'itemized',
  options: { gstPercent?: number; items?: SplitItem[]; participantCount?: number }
): Promise<string> {
  const splitsCol = collection(db, 'splits');
  const newSplitDoc = doc(splitsCol);
  
  const splitData = {
    id: newSplitDoc.id,
    ownerId,
    ownerName,
    totalAmount,
    gstPercent: options.gstPercent || 0,
    mode,
    status: 'collecting',
    createdAt: serverTimestamp(),
    ...(mode === 'itemized' ? { items: options.items || [] } : { participantCount: options.participantCount || 1 })
  };

  await setDoc(newSplitDoc, splitData);
  return newSplitDoc.id;
}

// Subscribe to a single split's metadata changes
export function subscribeToSplit(splitId: string, onUpdate: (split: Split | null) => void) {
  const docRef = doc(db, 'splits', splitId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate({ id: snapshot.id, ...snapshot.data() } as Split);
    } else {
      onUpdate(null);
    }
  });
}

// Subscribe to a split's participants list in real time
export function subscribeToParticipants(splitId: string, onUpdate: (participants: Participant[]) => void) {
  const pColRef = collection(db, 'splits', splitId, 'participants');
  return onSnapshot(pColRef, (snapshot) => {
    const list: Participant[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Participant);
    });
    onUpdate(list);
  });
}

// Join an existing split session as a participant
export async function joinSplit(
  splitId: string, 
  participantId: string, 
  name: string, 
  selectedItemIds: string[] = []
): Promise<void> {
  const pDocRef = doc(db, 'splits', splitId, 'participants', participantId);
  await setDoc(pDocRef, {
    name,
    selectedItemIds,
    hasPaid: false,
    amountOwed: 0
  });
}

// Update a participant's item selections before finalization
export async function updateParticipantItems(
  splitId: string,
  participantId: string,
  selectedItemIds: string[]
): Promise<void> {
  const pDocRef = doc(db, 'splits', splitId, 'participants', participantId);
  await updateDoc(pDocRef, { selectedItemIds });
}

// Finalize the split, calculating owed amounts and writing them back
export async function finalizeSplitBill(
  splitId: string,
  participants: Participant[],
  calculatedAmounts: { [participantId: string]: number }
): Promise<void> {
  const batch = writeBatch(db);
  
  // 1. Update split status
  const splitDocRef = doc(db, 'splits', splitId);
  batch.update(splitDocRef, { status: 'finalized' });

  // 2. Update each participant's amountOwed
  participants.forEach((p) => {
    const pDocRef = doc(db, 'splits', splitId, 'participants', p.id);
    const amount = calculatedAmounts[p.id] || 0;
    batch.update(pDocRef, { amountOwed: parseFloat(amount.toFixed(2)) });
  });

  await batch.commit();
}

// Record that a participant has settled their split share
export async function settleParticipantPayment(
  splitId: string,
  participantId: string
): Promise<void> {
  const pDocRef = doc(db, 'splits', splitId, 'participants', participantId);
  await updateDoc(pDocRef, { hasPaid: true });
}
