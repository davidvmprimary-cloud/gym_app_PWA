import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { useSessions } from '../hooks/useSessions';
import { useWeeklySchedule } from '../hooks/useWeeklySchedule';
import { useSplits } from '../hooks/useSplits';
import { db } from '../db/db';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { todaySession, createSession, getLastSessionOfSplit } = useSessions();
  const { schedule, loading: scheduleLoading } = useWeeklySchedule();
  const { splits } = useSplits();
  
  const [todaySplit, setTodaySplit] = useState(null);
  const [lastFinishedSession, setLastFinishedSession] = useState(null);
  const [lastSessionExercises, setLastSessionExercises] = useState([]);
  const [nameInput, setNameInput] = useState('');

  // 1. Get today's long date in Spanish
  const todayLabel = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

  // 2. Identify today's split
  useEffect(() => {
    if (!scheduleLoading && schedule) {
      // Map JS day (Sun=0) to user day (Mon=0)
      const jsDay = new Date().getDay();
      const userDay = (jsDay + 6) % 7; 
      const splitId = schedule[userDay];
      
      if (splitId) {
        const split = splits.find(s => s.id === splitId);
        setTodaySplit(split || null);
        
        // Load last session of this split
        const loadHistory = async () => {
          const last = await db.sessions
            .where('split_id')
            .equals(splitId)
            .and(s => s.completed_at !== null)
            .reverse()
            .sortBy('date');
          
          if (last.length > 0) {
            setLastFinishedSession(last[0]);
            const exers = await db.session_exercises
              .where('session_id')
              .equals(last[0].id)
              .toArray();
            
            const exNames = await Promise.all(
              exers.map(async (se) => {
                const ex = await db.exercises.get(se.exercise_id);
                return ex?.name || 'Unknown';
              })
            );
            setLastSessionExercises(exNames);
          }
        };
        loadHistory();
      } else {
        setTodaySplit(null);
      }
    }
  }, [schedule, scheduleLoading, splits]);

  if (profileLoading) return <div className={styles.loading}>Cargando perfil...</div>;

  // Onboarding screen
  if (!profile) {
    return (
      <div className={styles.onboarding}>
        <h2>¡Bienvenido a GymTracker!</h2>
        <p>¿Cómo te llamas?</p>
        <div style={{ marginTop: '1rem', width: '100%' }}>
          <input 
            className={styles.input}
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Tu nombre"
          />
          <button 
            className={styles.primaryBtn}
            style={{ width: '100%', marginTop: '10px' }}
            onClick={() => updateProfile({ name: nameInput || 'Usuario' })}
          >Empezar</button>
        </div>
      </div>
    );
  }

  const handleStartWorkout = async () => {
    navigate('/workout');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.dateLabel}>{todayLabel}</span>
        <h1 className={styles.splitTitle}>
          {todaySplit ? todaySplit.name : 'Día de descanso'}
        </h1>
      </header>

      <section className={styles.sessionControl}>
        {todaySplit ? (
          <button 
            className={styles.primaryBtn}
            onClick={handleStartWorkout}
          >
            {todaySession ? 'Continuar entrenamiento' : 'Iniciar entrenamiento'}
          </button>
        ) : (
          <div className="empty-state">
            <p>Disfruta de tu descanso, recuperarse es clave.</p>
            <button onClick={() => navigate('/profile')}>Asignar split al horario</button>
          </div>
        )}
      </section>

      {lastFinishedSession && todaySplit && (
        <section className={styles.lastSession}>
          <h3 className={styles.sectionTitle}>Última vez ({lastFinishedSession.date})</h3>
          <div className={styles.exerciseListSummary}>
            {lastSessionExercises.join(', ')}
          </div>
        </section>
      )}

      {/* Profile quick stats if needed */}
      {!lastFinishedSession && todaySplit && (
        <section className={styles.emptyState}>
          <p>Es la primera vez que haces este split. ¡A darlo todo!</p>
        </section>
      )}
    </div>
  );
}
