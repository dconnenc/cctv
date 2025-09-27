import { NavLink } from 'react-router-dom';

import { useUser } from '@cctv/contexts/UserContext';

export const TopNav = () => {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  return (
    <nav className="topnav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'link link--active' : 'link')}>
        Home
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => (isActive ? 'link link--active' : 'link')}>
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
    </nav>
  );
};
