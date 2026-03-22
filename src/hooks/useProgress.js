import { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useProfile } from './useProfile';
import { kgToLb, lbToKg } from '../utils/units';

export function useProgress(exerciseId) {
  const { profile } = useProfile();
  const [history, setHistory] = useState([]); // [{ date, maxWeight, volume, setsCount }]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;

    async function loadProgress() {
      setLoading(true);
      
      // 1. Get all session_exercises for this exercise
      const sessionExercises = await db.session_exercises
        .where('exercise_id')
        .equals(exerciseId)
        .toArray();

      const progressData = await Promise.all(
        sessionExercises.map(async (se) => {
          const session = await db.sessions.get(se.session_id);
          const sets = await db.sets
            .where('session_exercise_id')
            .equals(se.id)
            .toArray();

          if (sets.length === 0) return null;

          let maxWeight = 0;
          let volume = 0;

          sets.forEach(s => {
            let w = parseFloat(s.weight) || 0;
            const r = parseInt(s.reps) || 0;
            const setUnit = s.unit || 'kg';
            
            // Convert weight if it doesn't match the preferred unit
            const prefUnit = profile?.weight_unit || 'kg';
            if (setUnit !== prefUnit) {
               if (prefUnit === 'lb') w = kgToLb(w);
               else w = lbToKg(w);
            }
            
            if (w > maxWeight) maxWeight = w;
            volume += (w * r);
          });

          return {
            date: session?.date || 'Unknown',
            maxWeight: parseFloat(maxWeight.toFixed(1)),
            volume: parseFloat(volume.toFixed(1)),
            setsCount: sets.length
          };
        })
      );

      // Filter nulls, sort by date
      const validData = progressData
        .filter(d => d !== null)
        .sort((a,b) => a.date.localeCompare(b.date));

      setHistory(validData);
      setLoading(false);
    }
    loadProgress();
  }, [exerciseId]);

  return { history, loading };
}
