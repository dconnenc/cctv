import { useEffect, useRef, useState } from 'react';

import { NavLink } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';

import styles from './Navigation.module.scss';

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const { user, logOut, isLoading } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'link link--active' : 'link')}>
          Home
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
        >
          About
        </NavLink>
        <NavLink to="/join" className={({ isActive }) => (isActive ? 'link link--active' : 'link')}>
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
      </div>
      <div className={styles.topnav__mobile}>
        <button
          className={`${styles.topnav__toggle} ${open ? styles.isOpen : ''}`}
          aria-expanded={open}
          aria-controls="topnav-dropdown"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.topnav__icon} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div id="topnav-dropdown" className={styles.topnav__dropdown} role="menu">
          <div className={styles.topnav__dropdownInner}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
              onClick={() => setOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
              onClick={() => setOpen(false)}
            >
              About
            </NavLink>
            <NavLink
              to="/join"
              className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
              onClick={() => setOpen(false)}
            >
              Join
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/create"
                className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
                onClick={() => setOpen(false)}
              >
                Create
              </NavLink>
            )}
            {isLoading &&
              (user ? (
                <button
                  className="link"
                  onClick={() => {
                    setOpen(false);
                    void logOut();
                  }}
                >
                  Logout
                </button>
              ) : (
                <a className="link" href="/users/sign_in" onClick={() => setOpen(false)}>
                  Sign in
                </a>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
};
