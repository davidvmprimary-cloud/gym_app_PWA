import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const BottomNav = () => {
  return (
    <nav className={styles.nav}>
      <NavLink 
        to="/" 
        className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
      >
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>Home</span>
      </NavLink>
      
      <NavLink 
        to="/workout" 
        className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
      >
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14 4.14 5.57 2 7.71 3.43 9.14 2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86 19.86 18.43 22 16.29 20.57 14.86z"/>
        </svg>
        <span>Workout</span>
      </NavLink>

      <NavLink 
        to="/history" 
        className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
      >
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        <span>History</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
      >
        <svg className={styles.icon} viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.33-8 4v2h16v-2c0-2.67-5.33-4-8-4z"/>
        </svg>
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
