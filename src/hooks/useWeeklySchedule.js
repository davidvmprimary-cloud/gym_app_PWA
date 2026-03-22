import { useState, useEffect } from 'react';
import { db } from '../db/db';

export function useWeeklySchedule() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  const loadSchedule = async () => {
    setLoading(true);
    const result = await db.weekly_schedule.toArray();
    // Map to { day_of_week: split_id }
    const scheduleMap = {};
    result.forEach(row => {
      scheduleMap[row.day_of_week] = row.split_id;
    });
    setSchedule(scheduleMap);
    setLoading(false);
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const updateDaySchedule = async (dayOfWeek, splitId) => {
    // Delete existing entry for this day
    const entries = await db.weekly_schedule
      .where('day_of_week')
      .equals(dayOfWeek)
      .toArray();
    
    if (entries.length > 0) {
      const ids = entries.map(e => e.id);
      await db.weekly_schedule.bulkDelete(ids);
    }

    if (splitId !== null && splitId !== undefined && splitId !== "rest") {
      await db.weekly_schedule.add({
        day_of_week: dayOfWeek,
        split_id: splitId,
        created_at: new Date().toISOString()
      });
    }
    
    await loadSchedule();
  };

  return { schedule, loading, updateDaySchedule };
}
