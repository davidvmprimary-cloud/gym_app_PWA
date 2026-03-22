import Dexie from 'dexie';

/**
 * GymTracker Database Schema
 * Version 3 (as per Dexie standards and project requirements)
 */
export const db = new Dexie('GymTrackerDB');

db.version(3).stores({
  profile: 'id, name, created_at',
  splits: '++id, name, created_at, archived_at',
  exercises: '++id, name, color, created_at, archived_at',
  split_exercises: '++id, split_id, exercise_id, order_index, created_at, removed_at',
  exercise_metadata: '++id, exercise_id, key, created_at',
  weekly_schedule: '++id, day_of_week, split_id, created_at',
  sessions: '++id, date, split_id, started_at, completed_at',
  session_exercises: '++id, session_id, exercise_id, planned_exercise_id, is_swap, order_index, completed',
  sets: '++id, session_exercise_id, set_number, completed, created_at'
});

export default db;
