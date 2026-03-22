import { useState, useEffect } from 'react';
import { db } from '../db/db';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      // Profile ID is always 1
      const p = await db.profile.get(1);
      setProfile(p);
      setLoading(false);
    }
    loadProfile();
  }, []);

  const updateProfile = async (updatedData) => {
    const now = new Date().toISOString();
    const newData = { 
      ...profile, 
      ...updatedData, 
      id: 1, 
      updated_at: now 
    };
    
    if (!profile) {
      newData.created_at = now;
      await db.profile.add(newData);
    } else {
      await db.profile.update(1, newData);
    }
    
    setProfile(newData);
    return newData;
  };

  return { profile, loading, updateProfile };
}
