import { useState } from 'react';

import { NavLink, useLocation } from 'react-router-dom';

import {
  CalendarDays,
  Home,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Ticket,
  Tv,
  User as UserIcon,
  Users,
} from 'lucide-react';

import { useTheme } from '@cctv/contexts/ThemeContext';
import { useUser } from '@cctv/contexts/UserContext';
import { Switch } from '@cctv/core';
import { getSessionCreatedExperiences } from '@cctv/utils';

import styles from './Navigation.module.scss';

type MobilePanel = 'shows' | 'settings' | null;

const SHOWS_PATH_PREFIXES = ['/events', '/performers', '/join', '/experiences', '/create'];

export const TopNav = () => {
  const [activePanel, setActivePanel] = useState<MobilePanel>(null);
  const { user, logOut, isLoading } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const { theme, setTheme } = useTheme();
  const adminExperiences = getSessionCreatedExperiences();
  const location = useLocation();

  const togglePanel = (panel: MobilePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const closePanel = () => setActivePanel(null);

  const profileHref = user?.performer_slug
    ? `/performers/${user.performer_slug}`
    : '/performers/new';
  const profileLabel = user?.performer_slug ? 'Profile' : 'Become a Performer';

  const showsTabActive =
    activePanel === 'shows' ||
    SHOWS_PATH_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

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
            <div className={styles.dropdown}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.dropdownTrigger}`}
                aria-haspopup="menu"
              >
                Shows
              </button>
              <div className={styles.dropdownMenu} role="menu">
                <NavLink to="/events" className={() => styles.dropdownItem}>
                  <CalendarDays size={14} /> Browse Events
                </NavLink>
                <NavLink to="/performers" className={() => styles.dropdownItem}>
                  <Users size={14} /> Browse Performers
                </NavLink>
                <NavLink to="/join" className={() => styles.dropdownItem}>
                  <Ticket size={14} /> Join Show
                </NavLink>
                {isAdmin && (
                  <>
                    <div className={styles.dropdownDivider} aria-hidden />
                    {adminExperiences.length > 0 ? (
                      adminExperiences.map((e) => (
                        <NavLink
                          key={e.code}
                          to={`/experiences/${e.code}/manage`}
                          className={() => styles.dropdownItem}
                        >
                          <Tv size={14} /> {e.name}
                        </NavLink>
                      ))
                    ) : (
                      <span className={`${styles.dropdownItem} ${styles.dropdownItemEmpty}`}>
                        No recent
                      </span>
                    )}
                    <NavLink to="/create" className={() => styles.dropdownItem}>
                      <Plus size={14} /> Create Experience
                    </NavLink>
                    <NavLink to="/events/new" className={() => styles.dropdownItem}>
                      <Plus size={14} /> New Event
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.navRight}>
            <div className={styles.dropdown}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.dropdownTrigger}`}
                aria-haspopup="menu"
                aria-label="Settings"
              >
                <Settings size={16} />
              </button>
              <div className={styles.dropdownMenu} role="menu">
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
                {user && (
                  <NavLink to={profileHref} className={() => styles.dropdownItem}>
                    <UserIcon size={14} /> {profileLabel}
                  </NavLink>
                )}
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

      {activePanel === 'shows' && (
        <div className={styles.bottomPanel}>
          <NavLink to="/events" className={styles.bottomPanelLink} onClick={closePanel}>
            <CalendarDays size={16} /> Browse Events
          </NavLink>
          <NavLink to="/performers" className={styles.bottomPanelLink} onClick={closePanel}>
            <Users size={16} /> Browse Performers
          </NavLink>
          <NavLink to="/join" className={styles.bottomPanelLink} onClick={closePanel}>
            <Ticket size={16} /> Join Show
          </NavLink>
          {isAdmin && (
            <>
              <div className={styles.bottomPanelDivider} aria-hidden />
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
                <span className={`${styles.bottomPanelLink} ${styles.bottomPanelLinkEmpty}`}>
                  No recent experiences
                </span>
              )}
              <NavLink to="/create" className={styles.bottomPanelLink} onClick={closePanel}>
                <Plus size={16} /> Create Experience
              </NavLink>
              <NavLink to="/events/new" className={styles.bottomPanelLink} onClick={closePanel}>
                <Plus size={16} /> New Event
              </NavLink>
            </>
          )}
        </div>
      )}

      {activePanel === 'settings' && (
        <div className={styles.bottomPanel}>
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
          {user && (
            <NavLink to={profileHref} className={styles.bottomPanelLink} onClick={closePanel}>
              <UserIcon size={16} /> {profileLabel}
            </NavLink>
          )}
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
          <button
            type="button"
            className={`${styles.bottomTab} ${showsTabActive ? styles.bottomTabActive : ''}`}
            onClick={() => togglePanel('shows')}
          >
            <Tv size={20} />
            <span className={styles.bottomTabLabel}>Shows</span>
          </button>
          <button
            type="button"
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
