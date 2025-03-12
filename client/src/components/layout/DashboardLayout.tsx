import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import React from 'react';
import Sidebar from '../navigation/Sidebar';
import Header from '../navigation/Header';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../api/services/dashboardService';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  useEffect(() => {
    // Fetch dashboard data when component mounts
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await dashboardService.getDashboardData();
        setNotifications(dashboardData.notifications?.items || []);
        setNewRequestsCount(dashboardData.newRequests?.count || 0);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          notifications={notifications}
          newRequestsCount={newRequestsCount}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="container mx-auto px-4 py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;