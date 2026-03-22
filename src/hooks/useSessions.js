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
    const date = getTodayDate();
    const sessionId = await db.sessions.add({
      date,
      split_id: splitId,
      started_at: new Date().toISOString(),
      completed_at: null
    });
    const session = await db.sessions.get(sessionId);
    setTodaySession(session);
    return session;
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
