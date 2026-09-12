import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../services/firebase';
import type { Phone, Expense } from '../types';
import type { User } from '../services/firebase';

export function useFirebaseData(currentUser: User | null) {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribePhones: () => void;
    let unsubscribeExpenses: () => void;

    try {
      const phonesQuery = query(collection(db, 'phones'), orderBy('createdAt', 'desc'));
      unsubscribePhones = onSnapshot(phonesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Phone[];
        setPhones(data);
        setLoading(false);
      }, (err) => {
        console.error('Firestore phones error:', err);
        setLoading(false);
      });

      const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        setExpenses(data);
      }, (err) => {
        console.error('Firestore expenses error:', err);
      });
    } catch (e) {
      console.error('Error setting up listeners:', e);
      setLoading(false);
    }

    return () => {
      if (unsubscribePhones) unsubscribePhones();
      if (unsubscribeExpenses) unsubscribeExpenses();
    };
  }, [currentUser]);

  return { phones, expenses, loading };
}
