import { useState, useEffect, useRef } from 'react';
import { db } from '../db/db';

export function useWorkoutSets(sessionExerciseId, exerciseId, splitId) {
  const [sets, setSets] = useState([]);
  const [history, setHistory] = useState([]); // [{ reps, weight, unit }]
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef({}); // { setId: timer }

  useEffect(() => {
    async function init() {
      // 1. Get history (previous session of this split)
      const lastSessions = await db.sessions
        .where('split_id')
        .equals(splitId)
        .and(s => s.completed_at !== null)
        .reverse()
        .sortBy('date');

      if (lastSessions.length > 0) {
        const lastSessionId = lastSessions[0].id;
        const lastSessionEx = await db.session_exercises
          .where('session_id')
          .equals(lastSessionId)
          .and(se => se.exercise_id === exerciseId)
          .first();
        
        if (lastSessionEx) {
          const lastSets = await db.sets
            .where('session_exercise_id')
            .equals(lastSessionEx.id)
            .toArray();
          lastSets.sort((a,b) => a.set_number - b.set_number);
          setHistory(lastSets);
        }
      }

      // 2. Load sets for current session_exercise
      const currentSets = await db.sets
        .where('session_exercise_id')
        .equals(sessionExerciseId)
        .toArray();
      
      if (currentSets.length === 0) {
        // Pre-populate based on history or default 3
        const count = history.length > 0 ? history.length : 3;
        const newSets = [];
        for (let i = 1; i <= count; i++) {
          const sid = await db.sets.add({
            session_exercise_id: sessionExerciseId,
            set_number: i,
            reps: '',
            weight: '',
            unit: 'kg', // Default; should be profile unit
            completed: 0,
            created_at: new Date().toISOString()
          });
          newSets.push(await db.sets.get(sid));
        }
        setSets(newSets);
      } else {
        currentSets.sort((a,b) => a.set_number - b.set_number);
        setSets(currentSets);
      }
      setLoading(false);
    }
    init();
  }, [sessionExerciseId, exerciseId, splitId]);

  const updateSet = (id, updates) => {
    // Update local state immediately
    setSets(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

    // Debounce database update
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(async () => {
      await db.sets.update(id, updates);
      delete debounceTimers.current[id];
    }, 500);
  };

  const addSet = async () => {
    const nextNum = (sets[sets.length - 1]?.set_number || 0) + 1;
    const sid = await db.sets.add({
      session_exercise_id: sessionExerciseId,
      set_number: nextNum,
      reps: '',
      weight: '',
      unit: sets[0]?.unit || 'kg',
      completed: 0,
      created_at: new Date().toISOString()
    });
    setSets([...sets, await db.sets.get(sid)]);
  };

  const removeLastSet = async () => {
    if (sets.length === 0) return;
    const lastId = sets[sets.length - 1].id;
    await db.sets.delete(lastId);
    setSets(sets.slice(0, -1));
  };

  return { sets, history, loading, updateSet, addSet, removeLastSet };
}
