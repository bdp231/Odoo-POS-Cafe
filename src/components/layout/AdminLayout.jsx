import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout({ onToggleSidebar, sidebarOpen, onCloseSidebar }) {
  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
