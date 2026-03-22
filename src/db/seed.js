import { db } from './db.js';

/**
 * Seed database with demo profile, split, and exercises.
 * Only runs if the profile table is empty.
 */
export const seedDatabase = async () => {
  const profileCount = await db.profile.count();
  
  if (profileCount === 0) {
    const now = new Date().toISOString();
    
    // 1. Create Profile
    await db.profile.add({
      id: 1,
      name: 'Demo User',
      weight: 75,
      height: 180,
      dob: '1995-05-15',
      weight_unit: 'kg',
      created_at: now,
      updated_at: now
    });

    // 2. Create Legs Split
    const legsSplitId = await db.splits.add({
      name: 'Legs',
      created_at: now,
      archived_at: null
    });

    // 3. Create Exercises
    const hackSquatId = await db.exercises.add({
      name: 'Sentadilla Hack',
      color: '#e05c5c', // Red
      created_at: now,
      archived_at: null
    });

    const hipThrustId = await db.exercises.add({
      name: 'Hip Thrust',
      color: '#e08c3c', // Orange
      created_at: now,
      archived_at: null
    });

    const calfRaiseId = await db.exercises.add({
      name: 'Pantorrillas',
      color: '#d4c23a', // Yellow
      created_at: now,
      archived_at: null
    });

    // 4. Assign Exercises to Legs Split
    const exercises = [hackSquatId, hipThrustId, calfRaiseId];
    for (let i = 0; i < exercises.length; i++) {
      await db.split_exercises.add({
        split_id: legsSplitId,
        exercise_id: exercises[i],
        order_index: i,
        created_at: now,
        removed_at: null
      });
    }

    // 5. Add Metadata to Sentadilla Hack
    await db.exercise_metadata.add({
      exercise_id: hackSquatId,
      key: 'seat_height',
      value: '3',
      created_at: now
    });

    // 6. Set Weekly Schedule
    // Monday (0) and Thursday (3)
    await db.weekly_schedule.add({
      day_of_week: 0,
      split_id: legsSplitId,
      created_at: now
    });

    await db.weekly_schedule.add({
      day_of_week: 3,
      split_id: legsSplitId,
      created_at: now
    });

    console.log('Database successfully seeded with demo data.');
  }
};
