import { getDocs, query, where, collection } from "firebase/firestore";
import { firestore } from "../firebase";

export const fetchUniqueSuggestions = async (uid, type) => {
    try {
      const q = query(collection(firestore, type), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const seen = new Set();
      const results = [];
  
      snapshot.forEach(doc => {
        const data = doc.data();
        const key = `${data.name}|${data.address}|${data.phone}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ id: doc.id, ...data });
        }
      });
  
      return results;
    } catch (error) {
      throw new Error('Failed to fetch suggestions');
    }
  };