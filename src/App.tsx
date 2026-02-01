import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './NavBar';
import Study from './Study';
import Stats from './Stats';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/study" element={<Study />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/" element={<Navigate to="/study" replace />} />
        <Route path="*" element={<Navigate to="/study" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
