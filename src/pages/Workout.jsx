import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Workout.module.css';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { useWorkoutSets } from '../hooks/useWorkoutSets';
import { useExercises } from '../hooks/useExercises';
import { db } from '../db/db';

export default function Workout() {
  const navigate = useNavigate();
  const { 
    todaySession, 
    sessionExercises, 
    loading: managerLoading, 
    toggleExerciseCompleted, 
    swapExercise, 
    completeSession 
  } = useWorkoutManager();
  const { exercises: allExercises } = useExercises();
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [currentSwapId, setCurrentSwapId] = useState(null);
  const [anySetCompleted, setAnySetCompleted] = useState(false);
  
  const cardRefs = useRef({});

  // Check if at least one set in the entire session is completed
  useEffect(() => {
    async function checkGlobalProgress() {
      if (!todaySession) return;
      const allSets = await db.sets
        .where('completed')
        .equals(1)
        .toArray();
      
      // Filter the ones belonging to CURRENT session exercises
      const seIds = sessionExercises.map(se => se.id);
      const sessionSets = allSets.filter(s => seIds.includes(s.session_exercise_id));
      setAnySetCompleted(sessionSets.length > 0);
    }
    checkGlobalProgress();
  }, [sessionExercises, todaySession]);

  const completedCount = sessionExercises.filter(se => se.completed).length;
  const totalCount = sessionExercises.length;

  const ExerciseCard = ({ sessionEx, splitId, onSwap, onAutoScroll }) => {
    const [exercise, setExercise] = useState(null);
    const [metadata, setMetadata] = useState([]);
    const [lastFlashed, setLastFlashed] = useState(null);
    const { sets, history, loading: setsLoading, updateSet, addSet, removeLastSet } = useWorkoutSets(
      sessionEx.id, 
      sessionEx.exercise_id, 
      splitId
    );

    useEffect(() => {
      async function loadInfo() {
        const ex = await db.exercises.get(sessionEx.exercise_id);
        setExercise(ex);
        
        const meta = await db.exercise_metadata
          .where('exercise_id')
          .equals(sessionEx.exercise_id)
          .toArray();
        setMetadata(meta);
      }
      loadInfo();
    }, [sessionEx.exercise_id]);

    const handleSetCheck = async (setId, checked) => {
      await updateSet(setId, { completed: checked ? 1 : 0 });
      if (checked) {
        setLastFlashed(setId);
        setTimeout(() => setLastFlashed(null), 600);
      }
    };

    if (!exercise || setsLoading) return <div className={styles.loading}>...</div>;

    return (
      <div 
        ref={el => cardRefs.current[sessionEx.id] = el}
        className={`${styles.card} ${sessionEx.completed ? styles.completed : ''}`} 
        style={{ borderLeftColor: exercise.color }}
      >
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h3 className={styles.exerciseName}>{exercise.name}</h3>
              <span className={styles.improvementTag}>+0.0%</span>
            </div>
            <div className={styles.metadata}>
              {metadata.map(m => `${m.key}: ${m.value}`).join(' | ')}
            </div>
          </div>
          <button 
            className={`${styles.checkCircle} ${sessionEx.completed ? styles.checked : ''}`}
            onClick={async () => {
               const newStatus = !sessionEx.completed;
               await toggleExerciseCompleted(sessionEx.id, sessionEx.completed);
               if (newStatus) onAutoScroll(sessionEx.id);
            }} 
            aria-label="Toggle exercise"
          >
            {sessionEx.completed ? '✓' : ''}
          </button>
        </div>

        <div className={styles.setsList}>
          {sets.map((set, idx) => {
            const prev = history[idx];
            return (
              <div 
                key={set.id} 
                className={`${styles.setRow} ${lastFlashed === set.id ? styles.flashing : ''} ${set.completed === 1 ? styles.setRowCompleted : ''}`}
                style={{ '--accent-color': exercise.color }}
              >
                <div className={styles.setMain}>
                  <div className={styles.setPrimaryInfo}>
                    <div className={styles.setMeta}>
                       <span className={styles.setIndex}>#{idx + 1}</span>
                       <div className={styles.prevValue}>
                          {prev ? `↑ ${prev.weight}${prev.unit} × ${prev.reps}` : '—'}
                       </div>
                    </div>
                    
                    <div className={styles.inputsGroup}>
                      <div className={styles.inputWrapper}>
                        <input 
                          type="number" 
                          inputMode="numeric"
                          className={styles.repsInput}
                          value={set.reps}
                          onChange={e => updateSet(set.id, { reps: e.target.value })}
                          placeholder="0"
                        />
                        <span className={styles.inputLabel}>reps</span>
                      </div>

                      <div className={styles.inputWrapper}>
                        <input 
                          type="number" 
                          step="any"
                          inputMode="decimal"
                          className={styles.weightInput}
                          value={set.weight}
                          onChange={e => updateSet(set.id, { weight: e.target.value })}
                          placeholder="0"
                        />
                        <button 
                          className={styles.unitBtn}
                          onClick={() => updateSet(set.id, { unit: set.unit === 'kg' ? 'lb' : 'kg' })}
                        >{set.unit}</button>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  className={`${styles.setCheckBtn} ${set.completed === 1 ? styles.setCheckBtnChecked : ''}`}
                  onClick={() => handleSetCheck(set.id, set.completed !== 1)}
                >
                  {set.completed === 1 ? '✓' : `SET ${idx + 1}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.cardActions}>
          <button className={styles.actionBtn} onClick={addSet}>+ Agregar serie</button>
          {sets.length > 1 && <button className={styles.actionBtn} onClick={removeLastSet}>- Eliminar última</button>}
          <button className={styles.swapBtn} onClick={() => onSwap(sessionEx.id, 'swap')}>🔄 Cambiar</button>
        </div>
      </div>
    );
  };

  const handleFinish = async () => {
    if (confirm('¿Terminar entrenamiento?')) {
      await completeSession(todaySession.id);
      navigate('/');
    }
  };

  const openSwap = (id) => {
    setCurrentSwapId(id);
    setShowSwapModal(true);
  };

  const handleApplySwap = async (newExId) => {
    await swapExercise(currentSwapId, newExId);
    setShowSwapModal(false);
  };

  const handleAutoScroll = (completedId) => {
    const currentIndex = sessionExercises.findIndex(se => se.id === completedId);
    const nextUncompleted = sessionExercises.find((se, idx) => idx > currentIndex && !se.completed);
    
    if (nextUncompleted && cardRefs.current[nextUncompleted.id]) {
      cardRefs.current[nextUncompleted.id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (managerLoading || !todaySession) return <div className="loading-spinner">Iniciando sesión...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Salir</button>
        <button 
          className={styles.finishBtn} 
          onClick={handleFinish}
          disabled={!anySetCompleted}
        >Terminar</button>
      </header>

      <div className={styles.progressBar}>
        {completedCount} de {totalCount} ejercicios completados
      </div>

      <div className={styles.exercisesGrid}>
        {sessionExercises.map(se => (
          <ExerciseCard 
            key={se.id} 
            sessionEx={se} 
            splitId={todaySession.split_id}
            onSwap={(id, type) => {
              if (type === 'toggle') toggleExerciseCompleted(id, se.completed);
              else openSwap(id);
            }}
            onAutoScroll={handleAutoScroll}
          />
        ))}
      </div>

      {showSwapModal && (
        <div className="modal-backdrop" onClick={() => setShowSwapModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Sustituir Ejercicio</h3>
            <p className={styles.modalHint}>Este cambio es solo para hoy.</p>
            <div className={styles.exerciseSelectGrid}>
              {allExercises.map(ex => (
                <button 
                  key={ex.id} 
                  className={styles.exerciseOption}
                  onClick={() => handleApplySwap(ex.id)}
                >
                  <div className={styles.colorStrip} style={{ backgroundColor: ex.color }}></div>
                  <span>{ex.name}</span>
                </button>
              ))}
            </div>
            <button className={styles.closeBtn} onClick={() => setShowSwapModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
