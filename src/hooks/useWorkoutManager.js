import { useState, useEffect } from 'react';
import { db } from '../db/db';
import { useSessions } from './useSessions';
import { useWeeklySchedule } from './useWeeklySchedule';

export function useWorkoutManager() {
  const { todaySession, createSession, completeSession } = useSessions();
  const { schedule, loading: scheduleLoading } = useWeeklySchedule();
  
  const [sessionExercises, setSessionExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize session and its exercises
  useEffect(() => {
    let active = true;

    async function init() {
      if (scheduleLoading) return;
      
      const jsDay = new Date().getDay();
      const userDay = (jsDay + 6) % 7;
      const splitId = schedule[userDay];
      
      if (!splitId) {
        if (active) setLoading(false);
        return;
      }

      let session = todaySession;
      if (!session) {
        session = await createSession(splitId);
      }

      // Session is now guaranteed to have populate exercises thanks to the transaction in createSession
      const existing = await db.session_exercises
        .where('session_id')
        .equals(session.id)
        .toArray();

      existing.sort((a, b) => a.order_index - b.order_index);
      
      if (active) {
        setSessionExercises(existing);
        setLoading(false);
      }
    }

    init();
    return () => { active = false; };
  }, [schedule, scheduleLoading, todaySession]);

  const toggleExerciseCompleted = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    await db.session_exercises.update(id, { completed: newStatus });
    setSessionExercises(prev => 
      prev.map(se => se.id === id ? { ...se, completed: newStatus } : se)
    );
  };

  const swapExercise = async (sessionExId, newExerciseId) => {
    const original = sessionExercises.find(se => se.id === sessionExId);
    if (!original) return;

    await db.session_exercises.update(sessionExId, {
      exercise_id: newExerciseId,
      is_swap: true
    });
    
    setSessionExercises(prev => 
      prev.map(se => se.id === sessionExId ? { ...se, exercise_id: newExerciseId, is_swap: true } : se)
    );
  };

  return { 
    todaySession, 
    sessionExercises, 
    loading, 
    toggleExerciseCompleted, 
    swapExercise, 
    completeSession 
  };
}
