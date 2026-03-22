import { db } from '../db/db';

export function useExportImport() {
  const exportData = async () => {
    const data = {
      metadata: { 
        exported_at: new Date().toISOString(), 
        app_version: "1.0.0" 
      }
    };

    const tables = [
      'profile', 'splits', 'exercises', 'split_exercises', 
      'exercise_metadata', 'weekly_schedule', 'sessions', 
      'session_exercises', 'sets'
    ];

    for (const table of tables) {
      data[table] = await db.table(table).toArray();
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymtracker-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Validation
          const requiredTables = [
            'profile', 'splits', 'exercises', 'split_exercises', 
            'exercise_metadata', 'weekly_schedule', 'sessions', 
            'session_exercises', 'sets'
          ];
          
          for (const table of requiredTables) {
            if (!data[table]) throw new Error(`Missing table: ${table}`);
          }

          if (confirm('Esto reemplazará todos tus datos locales. ¿Continuar?')) {
            // Clear all tables
            for (const table of requiredTables) {
              await db.table(table).clear();
              await db.table(table).bulkAdd(data[table]);
            }
            alert('Datos importados con éxito. La aplicación se reiniciará.');
            window.location.reload();
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          alert('Error al importar: ' + err.message);
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  };

  return { exportData, importData };
}
