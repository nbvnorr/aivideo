import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Video, 
  PlayCircle, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Button } from '../ui/button';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: Video },
    { name: 'Series', href: '/series', icon: PlayCircle },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">AutoVid AI</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

