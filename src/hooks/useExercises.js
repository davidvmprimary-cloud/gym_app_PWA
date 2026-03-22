import { useState, useEffect } from 'react';
import { db } from '../db/db';

export function useExercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExercises = async () => {
    setLoading(true);
    const result = await db.exercises.filter(e => e.archived_at === null).toArray();
    setExercises(result);
    setLoading(false);
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const createExercise = async ({ name, color }) => {
    const id = await db.exercises.add({
      name,
      color,
      created_at: new Date().toISOString(),
      archived_at: null
    });
    await loadExercises();
    return id;
  };

  const updateExercise = async (id, { name, color }) => {
    await db.exercises.update(id, { name, color });
    await loadExercises();
  };

  const archiveExercise = async (id) => {
    await db.exercises.update(id, { archived_at: new Date().toISOString() });
    await loadExercises();
  };

  return { exercises, loading, createExercise, updateExercise, archiveExercise, loadExercises };
}
