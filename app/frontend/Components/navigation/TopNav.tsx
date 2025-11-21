import { useState } from 'react';

import { NavLink } from 'react-router-dom';

import { Settings } from 'lucide-react';

import { Switch } from '@cctv/components/ui/switch';
import { useTheme } from '@cctv/contexts';
import { useUser } from '@cctv/contexts/UserContext';
import { getSessionCreatedExperiences } from '@cctv/utils';

import styles from './Navigation.module.scss';

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const { user, logOut, isLoading } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const { theme, setTheme, bgAnimated, setBgAnimated } = useTheme();
  const adminExperiences = getSessionCreatedExperiences();

  return (
    <nav className={styles.topnav}>
      <div className={styles.topnav__inner}>
        <div className={styles.menuCluster}>
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
            {'Menu'}
          </button>
        </div>

        <div className={`${styles.drawer} ${open ? styles.isOpen : ''}`}>
          <span style={{ width: 16 }} />
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
          >
            {'Home'}
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
          >
            {'About'}
          </NavLink>
          <NavLink
            to="/join"
            className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
          >
            {'Join'}
          </NavLink>
          {isAdmin && (
            <>
              <div className={styles.dropdown}>
                <span className={`${styles.dropdownTrigger} link`}>{'Experiences'}</span>
                <div className={styles.dropdownMenu} role="menu">
                  {adminExperiences.length > 0 ? (
                    adminExperiences.map((e) => (
                      <NavLink
                        key={e.code}
                        to={`/experiences/${e.code}/manage`}
                        className={() => styles.dropdownItem}
                      >
                        {e.name}
                      </NavLink>
                    ))
                  ) : (
                    <span className={styles.dropdownItem} style={{ opacity: 0.7 }}>
                      No recent
                    </span>
                  )}
                </div>
              </div>
              <NavLink
                to="/create"
                className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
              >
                Create
              </NavLink>
            </>
          )}

          <span style={{ marginLeft: 'auto' }} />
          <div className={styles.dropdown}>
            <span className={`${styles.dropdownTrigger} link`} aria-haspopup="menu">
              <Settings size={16} />
            </span>
            <div className={styles.dropdownMenu} role="menu">
              <div className={styles.topnav__controlRow}>
                <span className={styles.switchLabel}>Background</span>
                <Switch
                  className={styles.switch}
                  checked={bgAnimated}
                  onCheckedChange={(checked) => setBgAnimated(!!checked)}
                  aria-label={bgAnimated ? 'Animated background' : 'Solid background'}
                  title={bgAnimated ? 'Animated background' : 'Solid background'}
                />
              </div>
              <div className={styles.topnav__controlRow}>
                <span className={styles.switchLabel}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
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
        </div>
      </div>

      <div className={styles.topnav__mobile}>
        <button
          className={styles.topnav__toggle}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.topnav__icon} />
        </button>
        <span className="link">CCTV</span>
      </div>

      {open && (
        <>
          <button
            className={styles.mobileBackdrop}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className={styles.topnav__dropdown}>
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
                <>
                  <div className={styles.dropdown}>
                    <span className={`${styles.dropdownTrigger} link`}>Experiences</span>
                    <div className={styles.dropdownMenu} role="menu">
                      {adminExperiences.length > 0 ? (
                        adminExperiences.map((e) => (
                          <NavLink
                            key={e.code}
                            to={`/experiences/${e.code}/manage`}
                            className={() => styles.dropdownItem}
                            onClick={() => setOpen(false)}
                          >
                            {e.name}
                          </NavLink>
                        ))
                      ) : (
                        <span className={styles.dropdownItem} style={{ opacity: 0.7 }}>
                          No recent
                        </span>
                      )}
                    </div>
                  </div>
                  <NavLink
                    to="/create"
                    className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
                    onClick={() => setOpen(false)}
                  >
                    Create
                  </NavLink>
                </>
              )}

              <div className={styles.topnav__controlRow}>
                <span className={styles.switchLabel}>Background</span>
                <Switch
                  className={styles.switch}
                  checked={bgAnimated}
                  onCheckedChange={(checked) => setBgAnimated(!!checked)}
                  aria-label={bgAnimated ? 'Animated background' : 'Solid background'}
                  title={bgAnimated ? 'Animated background' : 'Solid background'}
                />
              </div>
              <div className={styles.topnav__controlRow}>
                <span className={styles.switchLabel}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                <Switch
                  withIcons
                  className={styles.switch}
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => (checked ? setTheme('dark') : setTheme('light'))}
                  aria-label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  title={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                />
              </div>

              {!isLoading &&
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
        </>
      )}
    </nav>
  );
};
