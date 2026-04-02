import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminFooter from './AdminFooter';

interface AdminLayoutProps {
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ sidebarOpen: propSidebarOpen, onSidebarToggle: propOnToggle }) => {
  const [internalSidebarOpen, setInternalSidebarOpen] = React.useState(true);
  
  const isOpen = propSidebarOpen !== undefined ? propSidebarOpen : internalSidebarOpen;
  const handleToggle = propOnToggle || (() => setInternalSidebarOpen(!internalSidebarOpen));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar isOpen={isOpen} onToggle={handleToggle} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        <AdminHeader onMenuClick={handleToggle} />
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        
        <AdminFooter />
      </div>
    </div>
  );
};

export default AdminLayout;