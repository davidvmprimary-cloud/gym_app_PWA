import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import { useProfile } from '../hooks/useProfile';
import { useSplits } from '../hooks/useSplits';
import { useExercises } from '../hooks/useExercises';
import { useWeeklySchedule } from '../hooks/useWeeklySchedule';

// Header component to prevent focus loss on name edit
const SplitHeader = ({ split, onUpdate, onArchive }) => {
  const [localName, setLocalName] = useState(split.name);
  
  // Synchronize local state if name changes (e.g. from DB)
  useEffect(() => {
    setLocalName(split.name);
  }, [split.name]);

  return (
    <div className={styles.splitHeader}>
      <input 
        className={styles.splitNameInput}
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={() => {
          if (localName !== split.name) onUpdate(split.id, localName);
        }}
      />
      <button className={styles.miniBtn} onClick={() => onArchive(split.id)} title="Archivar split">📦</button>
    </div>
  );
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('info'); // info, splits, schedule
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  
  // Helpers
  const calculateAge = (dob) => {
    if (!dob) return null;
    try {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  };

  const COLORS = [
    '#e05c5c', '#e08c3c', '#d4c23a', '#6db87a', '#4a90d9', 
    '#9b6dd4', '#d46da3', '#6dbbd4', '#d4916d', '#a0a0a0'
  ];

  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const { 
    splits, 
    loading: splitsLoading, 
    createSplit, 
    updateSplitName, 
    archiveSplit, 
    addExerciseToSplit, 
    removeExerciseFromSplit, 
    reorderExercises,
    loadSplits
  } = useSplits();
  const { exercises, createExercise, updateExercise } = useExercises();
  const { schedule, updateDaySchedule } = useWeeklySchedule();

  // Local state for forms
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    weight: '',
    height: '',
    weight_unit: 'kg'
  });

  // Modal states
  const [modalType, setModalType] = useState(null); // 'createExercise', 'addExisting'
  const [currentSplitId, setCurrentSplitId] = useState(null);
  const [newExData, setNewExData] = useState({ name: '', color: COLORS[0] });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        dob: profile.dob || '',
        weight: profile.weight || '',
        height: profile.height || '',
        weight_unit: profile.weight_unit || 'kg'
      });
    }
  }, [profile]);

  const handleInfoSave = async () => {
    await updateProfile(formData);
    alert('Perfil guardado');
  };

  const handleWeightUnitToggle = (unit) => {
    if (formData.weight_unit === unit) return;
    
    let newWeight = formData.weight;
    if (unit === 'lb') {
      newWeight = (parseFloat(formData.weight) * 2.20462).toFixed(1);
    } else {
      newWeight = (parseFloat(formData.weight) / 2.20462).toFixed(1);
    }
    
    setFormData({ ...formData, weight: newWeight, weight_unit: unit });
  };

  const handleCreateExercise = async () => {
    if (!newExData.name) return;
    const exerciseId = await createExercise(newExData);
    const split = splits.find(s => s.id === currentSplitId);
    const nextOrder = split?.exercises?.length || 0;
    await addExerciseToSplit(currentSplitId, exerciseId, nextOrder);
    setModalType(null);
    setNewExData({ name: '', color: COLORS[0] });
  };

  const moveExercise = async (splitId, exercises, currentIndex, direction) => {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;

    const newExs = [...exercises];
    // Swap order_index logic
    const a = newExs[currentIndex];
    const b = newExs[newIndex];
    
    await reorderExercises(splitId, [
       { linkId: a.linkId, order_index: newIndex },
       { linkId: b.linkId, order_index: currentIndex }
    ]);
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión? Esto reiniciará el estado local.')) {
      localStorage.clear();
      window.location.reload(); // Simple reload for now
    }
  };

  if (profileLoading || splitsLoading) return <div className="loading-spinner">Cargando...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'info' ? styles.active : ''}`}
          onClick={() => setActiveTab('info')}
        >Mi Info</button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'splits' ? styles.active : ''}`}
          onClick={() => setActiveTab('splits')}
        >Mis Splits</button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'schedule' ? styles.active : ''}`}
          onClick={() => setActiveTab('schedule')}
        >Horario</button>
      </div>

      {activeTab === 'info' && (
        <section className={styles.section}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input 
              className={styles.input}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nacimiento <span className={styles.age}>({calculateAge(formData.dob)} años)</span></label>
            <input 
              type="date"
              className={styles.input}
              value={formData.dob}
              onChange={e => setFormData({ ...formData, dob: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Peso</label>
            <div className={styles.unitToggle}>
              <input 
                type="number"
                className={styles.input}
                style={{ flex: 2, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
              />
              <button 
                className={`${styles.toggleBtn} ${formData.weight_unit === 'kg' ? styles.active : ''}`}
                onClick={() => handleWeightUnitToggle('kg')}
              >kg</button>
              <button 
                className={`${styles.toggleBtn} ${formData.weight_unit === 'lb' ? styles.active : ''}`}
                onClick={() => handleWeightUnitToggle('lb')}
              >lb</button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Altura (cm)</label>
            <input 
              type="number"
              className={styles.input}
              value={formData.height}
              onChange={e => setFormData({ ...formData, height: e.target.value })}
            />
          </div>
          <button className={styles.saveBtn} onClick={handleInfoSave}>Guardar Perfil</button>
        </section>
      )}

      {activeTab === 'splits' && (
        <section className={styles.section}>
          {splits.map(split => {
            return (
              <div key={split.id} className={styles.splitCard}>
                <SplitHeader 
                  split={split} 
                  onUpdate={updateSplitName} 
                  onArchive={archiveSplit} 
                />
                
                <div className={styles.exerciseList}>
                  {split.exercises.map((ex, idx) => (
                    <div key={ex.linkId || ex.id} className={styles.exerciseItem}>
                      <div className={styles.colorDot} style={{ backgroundColor: ex.color }}></div>
                      <span className={styles.exerciseName}>{ex.name}</span>
                      <div className={styles.orderActions}>
                        <button className={styles.miniBtn} onClick={() => moveExercise(split.id, split.exercises, idx, 'up')}>↑</button>
                        <button className={styles.miniBtn} onClick={() => moveExercise(split.id, split.exercises, idx, 'down')}>↓</button>
                        <button className={`${styles.miniBtn} ${styles.removeBtn}`} onClick={() => removeExerciseFromSplit(ex.linkId)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className={styles.addBtn}
                  onClick={() => { setCurrentSplitId(split.id); setModalType('createExercise'); }}
                >+ Añadir Ejercicio</button>
              </div>
            );
          })}
          
          <button 
            className={styles.saveBtn} 
            style={{ backgroundColor: 'var(--surface-raised)' }}
            onClick={() => createSplit('Nuevo Split')}
          >+ Crear Nuevo Split</button>
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className={styles.section}>
          {DAYS.map((day, idx) => (
            <div key={idx} className={styles.scheduleRow}>
              <span className={styles.dayName}>{day}</span>
              <select 
                className={styles.splitSelect}
                value={schedule[idx] || 'rest'}
                onChange={(e) => updateDaySchedule(idx, e.target.value === 'rest' ? null : parseInt(e.target.value))}
              >
                <option value="rest">Descanso</option>
                {splits.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ))}
        </section>
      )}

      <button className={styles.logoutBtn} onClick={handleLogout}>Resetear Estado Local</button>

      {/* Basic Modal for Exercise Creation/Selection - Using Global Classes */}
      {modalType === 'createExercise' && (
        <div className="modal-backdrop" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Añadir Ejercicio</h3>
            
            {/* Split between existing and new */}
            <div style={{ marginTop: '1rem' }}>
              <label className={styles.label}>Seleccionar existente</label>
              <select 
                className={styles.input} 
                style={{ marginTop: '5px' }}
                onChange={async (e) => {
                  if (e.target.value) {
                    await addExerciseToSplit(currentSplitId, parseInt(e.target.value), splits.find(s => s.id === currentSplitId)?.exercises?.length || 0);
                    setModalType(null);
                  }
                }}
              >
                <option value="">-- Elige uno --</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <label className={styles.label}>O crear nuevo</label>
              <input 
                className={styles.input}
                style={{ marginTop: '5px' }}
                value={newExData.name}
                onChange={e => setNewExData({ ...newExData, name: e.target.value })}
                placeholder="Ej. Press de Banca"
              />
              
              <label className={styles.label} style={{ marginTop: '1rem', display: 'block' }}>Color</label>
              <div className={styles.colorPicker}>
                {COLORS.map(c => (
                  <div 
                    key={c}
                    className={styles.colorOption}
                    style={{ backgroundColor: c, border: newExData.color === c ? '3px solid white' : 'none' }}
                    onClick={() => setNewExData({ ...newExData, color: c })}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={styles.saveBtn} 
                style={{ flex: 1 }}
                onClick={handleCreateExercise}
              >Crear y Añadir</button>
              <button 
                className={styles.saveBtn} 
                style={{ flex: 1, backgroundColor: 'var(--surface-raised)' }}
                onClick={() => setModalType(null)}
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
