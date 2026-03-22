import { useState, useEffect } from 'react';
import { db } from '../db/db';

export function useSessions() {
  const [todaySession, setTodaySession] = useState(null);
  const [loading, setLoading] = useState(true);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const loadTodaySession = async () => {
    setLoading(true);
    const date = getTodayDate();
    const session = await db.sessions.where('date').equals(date).first();
    setTodaySession(session || null);
    setLoading(false);
  };

  useEffect(() => {
    loadTodaySession();
  }, []);

  const createSession = async (splitId) => {
    return await db.transaction('rw', [db.sessions, db.session_exercises, db.split_exercises], async () => {
      const date = getTodayDate();
      
      // Safety check: Avoid duplicate sessions for the same date/split if called concurrently
      const existing = await db.sessions.where('date').equals(date).first();
      if (existing) {
        setTodaySession(existing);
        return existing;
      }

      const sessionId = await db.sessions.add({
        date,
        split_id: splitId,
        started_at: new Date().toISOString(),
        completed_at: null
      });

      // Populate session_exercises from split links
      const links = await db.split_exercises
        .where('split_id')
        .equals(splitId)
        .and(link => link.removed_at === null)
        .toArray();

      links.sort((a, b) => a.order_index - b.order_index);

      for (const link of links) {
        await db.session_exercises.add({
          session_id: sessionId,
          exercise_id: link.exercise_id,
          planned_exercise_id: link.exercise_id,
          is_swap: false,
          order_index: link.order_index,
          completed: 0
        });
      }

      const session = await db.sessions.get(sessionId);
      setTodaySession(session);
      return session;
    });
  };

  const completeSession = async (id) => {
    await db.sessions.update(id, { completed_at: new Date().toISOString() });
    await loadTodaySession();
  };

  const getLastSessionOfSplit = async (splitId) => {
    // Get last completed session for this split
    const sessions = await db.sessions
      .where('split_id')
      .equals(splitId)
      .and(s => s.completed_at !== null)
      .reverse()
      .sortBy('date');
    
    return sessions.length > 0 ? sessions[0] : null;
  };

  const getExercisesForSession = async (sessionId) => {
    return await db.session_exercises
      .where('session_id')
      .equals(sessionId)
      .toArray();
  };

  return { 
    todaySession, 
    loading, 
    createSession, 
    completeSession, 
    loadTodaySession, 
    getLastSessionOfSplit,
    getExercisesForSession
  };
}
