import { useEffect, useRef, useState } from 'react';

import { NavLink } from 'react-router-dom';

import { Switch } from '@cctv/components/ui/switch';
import { useTheme } from '@cctv/contexts';
import { useUser } from '@cctv/contexts/UserContext';

import styles from './Navigation.module.scss';

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const { user, logOut, isLoading } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const { theme, setTheme, bgAnimated, setBgAnimated } = useTheme();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node | null;
      if (navRef.current && target && !navRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <nav className={styles.topnav} ref={navRef}>
      <div className={styles.topnav__inner}>
        <button
          className={`${styles.recBtn} ${open ? styles.recBtnOpen : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        />
        <button
          className={styles.menuPill}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>

        {open && (
          <>
            <span style={{ width: 16 }} />
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
            >
              About
            </NavLink>
            <NavLink
              to="/join"
              className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
            >
              Join
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/create"
                className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
              >
                Create
              </NavLink>
            )}

            <span style={{ marginLeft: 'auto' }} />
            <div className={styles.switchGroup}>
              <div className={styles.switchRow}>
                <span className={styles.switchLabel}>Background</span>
                <Switch
                  className={styles.switch}
                  checked={bgAnimated}
                  onCheckedChange={(checked) => setBgAnimated(!!checked)}
                  aria-label={bgAnimated ? 'Animated background' : 'Solid background'}
                  title={bgAnimated ? 'Animated background' : 'Solid background'}
                />
              </div>
              <div className={styles.switchRow}>
                <span className={styles.switchLabel}>Theme</span>
                <Switch
                  withIcons
                  className={styles.switch}
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => (checked ? setTheme('dark') : setTheme('light'))}
                  aria-label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  title={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                />
              </div>
            </div>

            {!isLoading &&
              (user ? (
                <button className="link" onClick={() => void logOut()}>
                  Logout
                </button>
              ) : (
                <a className="link" href="/users/sign_in">
                  Sign in
                </a>
              ))}
          </>
        )}
      </div>
    </nav>
  );
};
