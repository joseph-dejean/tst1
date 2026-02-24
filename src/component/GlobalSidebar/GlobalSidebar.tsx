import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, AdminPanelSettings, ChatBubbleOutline } from '@mui/icons-material';
import SidebarMenuItem from './SidebarMenuItem';
import { useAccessRequest } from '../../contexts/AccessRequestContext';
import './GlobalSidebar.css';
import { fetchDataProductsList } from '../../features/dataProducts/dataProductsSlice';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';

interface GlobalSidebarProps {
  isHomePage?: boolean;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ isHomePage = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccessPanelOpen } = useAccessRequest();


  // Determine active states based on current route
  const isSearchActive = ['/home', '/search', '/view-details'].includes(location.pathname);

  const isDataProductsActive = location.pathname.startsWith('/data-products');
  const isChatActive = location.pathname === '/global-chat';
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const handleSearchClick = () => {
    navigate('/search');
  };



  const handleLogoClick = () => {
    navigate('/home');
  };

  const handleDataProducts = () => {
    dispatch(fetchDataProductsList({ id_token: user?.token }));
    navigate('/data-products');
  };

  return (
    <nav
      className={`global-sidebar ${isHomePage ? 'partial-height' : 'full-height'}`}
      style={{
        zIndex: isAccessPanelOpen ? 999 : 1200,
      }}
    >
      {!isHomePage && (
        <div className="sidebar-logo-container" onClick={handleLogoClick}>
          <img
            src="/assets/svg/dataplex-logo-icon.svg"
            alt="Dataplex"
            className="logo-icon-only"
          />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Dataplex</span>
            <span className="sidebar-practice-label">Catalog France Practice</span>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="sidebar-menu-items">
        {/* Search */}
        <SidebarMenuItem
          icon={<Search sx={{ fontSize: 20 }} />}
          label="Search"
          isActive={isSearchActive}
          onClick={handleSearchClick}
        />



        {/* Data Products */}
        <SidebarMenuItem
          icon={<img src="/assets/svg/data-products-icon.svg" alt="Data Products" style={{ width: 20, height: 20 }} />}
          label="Data Products"
          isActive={isDataProductsActive}
          disabled={false}
          multiLine={false}
          onClick={() => { handleDataProducts(); }}
        />

        {/* Chat */}
        <SidebarMenuItem
          icon={<ChatBubbleOutline sx={{ fontSize: 20 }} />}
          label="Chat"
          isActive={isChatActive}
          onClick={() => navigate('/global-chat')}
        />

        {/* Access Management */}
        {user?.isAdmin && (
          <SidebarMenuItem
            icon={<AdminPanelSettings sx={{ fontSize: 20, color: ['/admin-access', '/access-requests'].includes(location.pathname) ? '#0E4DCA' : '#5F6368' }} />}
            label="Admin"
            isActive={['/admin-access', '/access-requests'].includes(location.pathname)}
            onClick={() => navigate('/admin-access')}
          />
        )}

      </div>

      {/* Browse Popover */}

    </nav>
  );
};

export default GlobalSidebar;
