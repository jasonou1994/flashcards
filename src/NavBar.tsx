import React from 'react';
import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="nav">
      <NavLink to="/study" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>Study</NavLink>
      <NavLink to="/stats" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>Stats</NavLink>
    </nav>
  );
}
