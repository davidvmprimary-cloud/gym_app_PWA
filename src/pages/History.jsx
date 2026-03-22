import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import styles from './History.module.css';
import { useHistory } from '../hooks/useHistory';
import { useProgress } from '../hooks/useProgress';
import { useExercises } from '../hooks/useExercises';
import { useProfile } from '../hooks/useProfile';
import { useExportImport } from '../hooks/useExportImport';

export default function History() {
  const [view, setView] = useState('sessions'); // sessions | progress
  const { weeksGrouped, loading: historyLoading, loadMoreWeeks } = useHistory();
  const { exercises: allExercises } = useExercises();
  const [selectedExId, setSelectedExId] = useState('');
  const { history: progressHistory, loading: progressLoading } = useProgress(selectedExId);
  const { profile } = useProfile();
  const { exportData, importData } = useExportImport();
  
  const fileInputRef = useRef(null);
  const prefUnit = profile?.weight_unit || 'kg';

  // Helper for Spanish Date formatting
  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    }).replace(/^\w/, (c) => c.toUpperCase());
  };

  const SessionItem = ({ session }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className={styles.sessionCard}>
        <div className={styles.sessionHeader} onClick={() => setExpanded(!expanded)}>
          <div className={styles.sessDate}>{formatDateLong(session.date)}</div>
          <div className={styles.sessSplit}>
            <span>{session.splitName}</span>
            {!session.completed_at && <span className={`${styles.sessBadge} ${styles.incomplete}`}>Sesión incompleta</span>}
          </div>
          
          <div className={styles.exerciseSummaryList}>
            {session.exercises.map(ex => (
              <div key={ex.id} className={styles.exerciseSum}>
                • {ex.name} 
                {ex.is_swap && <span className={styles.swapLabel}>(swap temporal)</span>}
                <span className={styles.exerciseSets}>
                   — {ex.sets.length} series: {ex.sets.map(s => `${s.weight}×${s.reps}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {expanded && (
          <div className={styles.sessionDetail}>
            {session.exercises.map(ex => (
              <div key={ex.id} style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{ex.name}</strong>
                <div style={{ paddingLeft: '10px', marginTop: '5px' }}>
                  {ex.sets.map((s, idx) => (
                    <div key={s.id} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      S{idx + 1}: {s.weight}kg × {s.reps} {s.completed ? '✓' : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await importData(e.target.files[0]);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.toolbar}>
        <div className={styles.toggleGroup}>
          <button 
            className={`${styles.toggleBtn} ${view === 'sessions' ? styles.active : ''}`}
            onClick={() => setView('sessions')}
          >Sesiones</button>
          <button 
            className={`${styles.toggleBtn} ${view === 'progress' ? styles.active : ''}`}
            onClick={() => setView('progress')}
          >Progreso</button>
        </div>
        
        <div className={styles.exportImportGroup}>
          <button className={styles.iconBtn} onClick={exportData} title="Exportar datos">📤</button>
          <button className={styles.iconBtn} onClick={handleImportClick} title="Importar datos">📥</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className={styles.hiddenInput} 
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
      </header>

      {view === 'sessions' && (
        <div className={styles.historyList}>
          {weeksGrouped.map((week, idx) => (
            <section key={idx} className={styles.weekSection}>
              <h4 className={styles.weekTitle}>
                Semana del {new Date(week.weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </h4>
              {week.sessions.length > 0 ? (
                week.sessions.map(sess => (
                  <SessionItem key={sess.id} session={sess} />
                ))
              ) : (
                <div className="empty-state">
                  <p>No hay entrenamientos esta semana.</p>
                  <button onClick={() => navigate('/')}>Ir al Home</button>
                </div>
              )}
            </section>
          ))}
          
          <button 
            className={styles.loadMoreBtn} 
            onClick={loadMoreWeeks}
            disabled={historyLoading}
          >
            {historyLoading ? 'Cargando...' : 'Cargar semana anterior'}
          </button>
        </div>
      )}

      {view === 'progress' && (
        <div className={styles.progressView}>
          <select 
            className={styles.exerciseSelect}
            value={selectedExId}
            onChange={(e) => setSelectedExId(parseInt(e.target.value))}
          >
            <option value="">Selecciona un ejercicio...</option>
            {allExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          {selectedExId && progressHistory.length < 2 && !progressLoading && (
            <p className={styles.exerciseSets}>Necesitas al menos 2 sesiones con este ejercicio para ver progreso.</p>
          )}

          {selectedExId && progressHistory.length >= 2 && (
            <>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-secondary)" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)" 
                      tick={{ fontSize: 10 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--accent)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="maxWeight" 
                      stroke="var(--accent)" 
                      strokeWidth={3}
                      dot={{ fill: 'var(--accent)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={styles.tableCard}>
                <h4 className={styles.weekTitle}>Últimas 10 sesiones</h4>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Series</th>
                      <th>Máx ({prefUnit})</th>
                      <th>Volumen ({prefUnit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressHistory.slice(-10).reverse().map((d, i) => (
                      <tr key={i}>
                        <td>{d.date.split('-').slice(1).join('/')}</td>
                        <td>{d.setsCount}</td>
                        <td style={{ fontWeight: 600 }}>{d.maxWeight}</td>
                        <td>{d.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
