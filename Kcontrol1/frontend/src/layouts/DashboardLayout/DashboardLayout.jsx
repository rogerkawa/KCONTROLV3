
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';

import './DashboardLayout.css';

function DashboardLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    function toggleSidebar() {
        setSidebarCollapsed((atual) => !atual);
    }

    return (
        <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>

            <Sidebar collapsed={sidebarCollapsed} />

            <div className="dashboard-main">
                <Header
                    onToggleSidebar={toggleSidebar}
                    sidebarCollapsed={sidebarCollapsed}
                />

                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>

        </div>
    );
}

export default DashboardLayout;
