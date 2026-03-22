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
    async function init() {
      if (scheduleLoading) return;
      
      const jsDay = new Date().getDay();
      const userDay = (jsDay + 6) % 7;
      const splitId = schedule[userDay];
      
      if (!splitId) {
        setLoading(false);
        return;
      }

      let session = todaySession;
      if (!session) {
        session = await createSession(splitId);
      }

      // Load session exercises
      const existing = await db.session_exercises
        .where('session_id')
        .equals(session.id)
        .toArray();

      if (existing.length === 0) {
        // Create session_exercises from split links
        const links = await db.split_exercises
          .where('split_id')
          .equals(splitId)
          .and(link => link.removed_at === null)
          .toArray();

        links.sort((a,b) => a.order_index - b.order_index);

        const newSEs = await Promise.all(
          links.map(async (link) => {
            const sid = await db.session_exercises.add({
              session_id: session.id,
              exercise_id: link.exercise_id,
              planned_exercise_id: link.exercise_id,
              is_swap: false,
              order_index: link.order_index,
              completed: 0
            });
            return db.session_exercises.get(sid);
          })
        );
        setSessionExercises(newSEs);
      } else {
        existing.sort((a,b) => a.order_index - b.order_index);
        setSessionExercises(existing);
      }
      setLoading(false);
    }
    init();
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
