import { useState, useEffect } from 'react';
import { db } from '../db/db';

export function useSplits() {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSplits = async () => {
    setLoading(true);
    // 1. Get all active splits (where archived_at is null)
    const resultSplits = await db.splits
      .filter(s => s.archived_at === null)
      .toArray();

    // 2. For each split, load its exercises
    const splitsWithExercises = await Promise.all(
      resultSplits.map(async (split) => {
        const links = await db.split_exercises
          .where('split_id')
          .equals(split.id)
          .and(link => link.removed_at === null)
          .toArray();

        // Sort by order_index
        links.sort((a, b) => a.order_index - b.order_index);

        const exercises = await Promise.all(
          links.map(async (link) => {
            const exe = await db.exercises.get(link.exercise_id);
            return { ...exe, linkId: link.id, order_index: link.order_index };
          })
        );

        return { ...split, exercises };
      })
    );

    setSplits(splitsWithExercises);
    setLoading(false);
  };

  useEffect(() => {
    loadSplits();
  }, []);

  const createSplit = async (name) => {
    const id = await db.splits.add({
      name,
      created_at: new Date().toISOString(),
      archived_at: null
    });
    await loadSplits();
    return id;
  };

  const updateSplitName = async (id, name) => {
    await db.splits.update(id, { name });
    await loadSplits();
  };

  const archiveSplit = async (id) => {
    if (confirm('¿Seguro que quieres archivar este split? No aparecerá más en tu horario ni entrenamientos activos.')) {
      await db.splits.update(id, { archived_at: new Date().toISOString() });
      await loadSplits();
    }
  };

  const addExerciseToSplit = async (splitId, exerciseId, orderIndex) => {
    await db.split_exercises.add({
      split_id: splitId,
      exercise_id: exerciseId,
      order_index: orderIndex,
      created_at: new Date().toISOString(),
      removed_at: null
    });
    await loadSplits();
  };

  const removeExerciseFromSplit = async (linkId) => {
    await db.split_exercises.update(linkId, { removed_at: new Date().toISOString() });
    await loadSplits();
  };

  const reorderExercises = async (splitId, newLinks) => {
    // newLinks is array of {linkId, order_index}
    await Promise.all(
      newLinks.map(link => db.split_exercises.update(link.linkId, { order_index: link.order_index }))
    );
    await loadSplits();
  };

  return { 
    splits, 
    loading, 
    createSplit, 
    updateSplitName, 
    archiveSplit, 
    addExerciseToSplit, 
    removeExerciseFromSplit, 
    reorderExercises,
    loadSplits
  };
}
