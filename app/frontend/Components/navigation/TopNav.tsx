import { useState } from 'react';

import { NavLink, useLocation } from 'react-router-dom';

import { Home, Info, LogIn, LogOut, Plus, Settings, Ticket, Tv } from 'lucide-react';

import { useTheme } from '@cctv/contexts/ThemeContext';
import { useUser } from '@cctv/contexts/UserContext';
import { Switch } from '@cctv/core';
import { getSessionCreatedExperiences } from '@cctv/utils';

import styles from './Navigation.module.scss';

type MobilePanel = 'experiences' | 'settings' | null;

export const TopNav = () => {
  const [activePanel, setActivePanel] = useState<MobilePanel>(null);
  const { user, logOut, isLoading } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const { theme, setTheme, bgAnimated, setBgAnimated } = useTheme();
  const adminExperiences = getSessionCreatedExperiences();
  const location = useLocation();

  const togglePanel = (panel: MobilePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const closePanel = () => setActivePanel(null);

  return (
    <>
      <nav className={styles.topnav}>
        <div className={styles.topnav__inner}>
          <NavLink to="/" end className={styles.logoLockup}>
            <span className={styles.logoCh}>Ch. 77</span>
            <span className={styles.logoName}>
              Chicago <span className={styles.logoAccent}>Comedy</span> TV
            </span>
          </NavLink>

          <div className={styles.navLinks}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/join"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Join
            </NavLink>
            {isAdmin && (
              <>
                <div className={styles.dropdown}>
                  <span className={`${styles.navLink} ${styles.dropdownTrigger}`}>Experiences</span>
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
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  Create
                </NavLink>
              </>
            )}
          </div>

          <div className={styles.navRight}>
            <div className={styles.dropdown}>
              <span className={`${styles.navLink} ${styles.dropdownTrigger}`} aria-haspopup="menu">
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
                <button className={styles.navLink} onClick={() => void logOut()}>
                  Logout
                </button>
              ) : (
                <a className={styles.navLink} href="/users/sign_in">
                  Sign in
                </a>
              ))}
          </div>
        </div>
      </nav>

      {activePanel && (
        <button
          className={styles.bottomPanelBackdrop}
          aria-label="Close panel"
          onClick={closePanel}
        />
      )}

      {activePanel === 'experiences' && (
        <div className={styles.bottomPanel}>
          {adminExperiences.length > 0 ? (
            adminExperiences.map((e) => (
              <NavLink
                key={e.code}
                to={`/experiences/${e.code}/manage`}
                className={styles.bottomPanelLink}
                onClick={closePanel}
              >
                <Tv size={16} /> {e.name}
              </NavLink>
            ))
          ) : (
            <span className={styles.bottomPanelLink} style={{ opacity: 0.5, cursor: 'default' }}>
              No recent experiences
            </span>
          )}
          <NavLink to="/create" className={styles.bottomPanelLink} onClick={closePanel}>
            <Plus size={16} /> Create
          </NavLink>
        </div>
      )}

      {activePanel === 'settings' && (
        <div className={styles.bottomPanel}>
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
                className={styles.bottomPanelLink}
                onClick={() => {
                  closePanel();
                  void logOut();
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <a className={styles.bottomPanelLink} href="/users/sign_in" onClick={closePanel}>
                <LogIn size={16} /> Sign in
              </a>
            ))}
        </div>
      )}

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
            }
            onClick={closePanel}
          >
            <Home size={20} />
            <span className={styles.bottomTabLabel}>Home</span>
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
            }
            onClick={closePanel}
          >
            <Info size={20} />
            <span className={styles.bottomTabLabel}>About</span>
          </NavLink>
          <NavLink
            to="/join"
            className={({ isActive }) =>
              `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
            }
            onClick={closePanel}
          >
            <Ticket size={20} />
            <span className={styles.bottomTabLabel}>Join</span>
          </NavLink>
          {isAdmin && (
            <button
              className={`${styles.bottomTab} ${
                activePanel === 'experiences' || location.pathname.includes('/experiences')
                  ? styles.bottomTabActive
                  : ''
              }`}
              onClick={() => togglePanel('experiences')}
            >
              <Tv size={20} />
              <span className={styles.bottomTabLabel}>Shows</span>
            </button>
          )}
          <button
            className={`${styles.bottomTab} ${activePanel === 'settings' ? styles.bottomTabActive : ''}`}
            onClick={() => togglePanel('settings')}
          >
            <Settings size={20} />
            <span className={styles.bottomTabLabel}>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};
