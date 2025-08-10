import { NavLink } from 'react-router-dom';

export const TopNav = () => {
  return (
    <nav className="topnav">
      <NavLink
        to="/"
        end
        style={{ marginRight: 12 }}
        className={({ isActive }) => (isActive ? 'link link--active' : 'link')}
      >
        {'Home'}
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => (isActive ? 'link link--active' : 'link')}>
        {'About'}
      </NavLink>
    </nav>
  );
};
