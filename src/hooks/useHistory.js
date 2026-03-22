import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';

export function useHistory() {
  const [weeksGrouped, setWeeksGrouped] = useState([]); // [{ weekStart, sessions: [] }]
  const [weeksLoaded, setWeeksLoaded] = useState(0); // number of weeks back loaded
  const [loading, setLoading] = useState(false);

  // Helper to get Monday of the week
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    const mon = new Date(date.setDate(diff));
    mon.setHours(0,0,0,0);
    return mon;
  };

  const loadMoreWeeks = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    
    // We want to load the week (now - weeksLoaded)
    const weekStart = getMonday(now);
    weekStart.setDate(weekStart.getDate() - (weeksLoaded * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const startISO = weekStart.toISOString().split('T')[0];
    const endISO = weekEnd.toISOString().split('T')[0];

    const results = await db.sessions
      .where('date')
      .between(startISO, endISO)
      .reverse()
      .sortBy('date');

    const sessionsWithDetails = await Promise.all(
      results.map(async (sess) => {
        const split = await db.splits.get(sess.split_id);
        const sesExers = await db.session_exercises
          .where('session_id')
          .equals(sess.id)
          .toArray();
        
        const detailedExers = await Promise.all(
          sesExers.map(async (se) => {
            const exInfo = await db.exercises.get(se.exercise_id);
            const sets = await db.sets
              .where('session_exercise_id')
              .equals(se.id)
              .toArray();
            sets.sort((a,b) => a.set_number - b.set_number);
            return { ...se, ...exInfo, sets };
          })
        );
        detailedExers.sort((a,b) => a.order_index - b.order_index);

        return { ...sess, splitName: split?.name || 'Unknown', exercises: detailedExers };
      })
    );

    if (sessionsWithDetails.length > 0) {
      setWeeksGrouped(prev => [
        ...prev, 
        { weekStart: startISO, sessions: sessionsWithDetails }
      ]);
    } else if (weeksLoaded === 0) {
      // Still add the current empty week if it's the first one
      setWeeksGrouped([{ weekStart: startISO, sessions: [] }]);
    } else {
      // Keep trying older weeks? For now just add an empty group or stop
      setWeeksGrouped(prev => [
        ...prev, 
        { weekStart: startISO, sessions: [] }
      ]);
    }

    setWeeksLoaded(prev => prev + 1);
    setLoading(false);
  }, [weeksLoaded]);

  useEffect(() => {
    loadMoreWeeks();
  }, []);

  return { weeksGrouped, loading, loadMoreWeeks };
}
