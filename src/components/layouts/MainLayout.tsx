import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  History,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('reelpilot_sidebar_collapsed') === 'true';
  });
  
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, disabled: false },
    { name: 'Calendar', path: '/calendar', icon: Calendar, disabled: false },
    { name: 'Library', path: '/library', icon: FolderKanban, disabled: false },
    { name: 'Upload Logs', path: '/logs', icon: History, disabled: false },
    { name: 'Settings', path: '/settings', icon: Settings, disabled: false },
  ];

  const currentPath = location.pathname;

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('reelpilot_sidebar_collapsed', String(nextState));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100" id="main-layout-root">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-zinc-900/40 border-r border-zinc-900/80 flex-shrink-0 relative z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header/Logo */}
        <div className={`h-16 flex items-center border-b border-zinc-900/60 justify-between ${isCollapsed ? 'px-4' : 'px-6'}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tight shadow-md shadow-black/15 flex-shrink-0">
              RP
            </div>
            {!isCollapsed && (
              <span className="font-semibold tracking-tight text-zinc-100 text-sm animate-in fade-in duration-200">ReelPilot</span>
            )}
          </Link>
          {!isCollapsed && (
            <StatusBadge status="active" label="Worker Active" className="scale-90 animate-in fade-in duration-200" />
          )}
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 py-6 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative group ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'text-zinc-950 bg-zinc-50'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-zinc-50 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-100'}`} />
                {!isCollapsed && (
                  <span className="animate-in fade-in duration-150">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Workspace Quick Status */}
        <div className={`border-t border-zinc-900/60 bg-zinc-900/10 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          {!isCollapsed ? (
            <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/50 p-3.5 space-y-2.5 animate-in fade-in duration-250">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Sync Status</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Drive folder synced 12 minutes ago. Next auto-check in 18 minutes.
              </p>
              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium rounded-md transition-colors border border-zinc-700/30 cursor-pointer">
                <RefreshCw className="h-3 w-3" />
                Sync Now
              </button>
            </div>
          ) : (
            <button 
              className="w-full flex items-center justify-center p-2.5 bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Sync Google Drive folder"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {/* Sidebar Expand / Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className={`w-full mt-3 flex items-center justify-center py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-900/60 rounded-lg transition-all cursor-pointer text-[10px] uppercase tracking-wider font-bold gap-1.5`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4.5 w-4.5" />
            ) : (
              <>
                <ChevronLeft className="h-4.5 w-4.5" />
                <span>Collapse Panel</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-zinc-900 z-50 p-4 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between h-12 mb-6 border-b border-zinc-900 pb-2">
                <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setIsMobileOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tight shadow-md shadow-black/15">
                    RP
                  </div>
                  <span className="font-semibold tracking-tight text-zinc-100 text-sm">ReelPilot</span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-zinc-950 bg-zinc-50'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-2 border-t border-zinc-900 mt-auto">
                <StatusBadge status="active" label="Worker Active" className="w-full justify-center py-1.5" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-zinc-950/60 backdrop-blur-md border-b border-zinc-900/80 flex items-center justify-between px-4 sm:px-8 relative z-25">
          {/* Menu button for mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open mobile navigation menu"
              className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="font-semibold tracking-tight text-sm text-zinc-100">ReelPilot</span>
          </div>

          {/* Search UI - Desktop & Tablet */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900/40 border border-zinc-900 px-3.5 py-2 rounded-lg w-64 md:w-72 text-zinc-400 transition-all focus-within:border-zinc-800 focus-within:w-80 group">
            <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-zinc-400" />
            <input
              type="text"
              aria-label="Search reels, tags or files"
              placeholder="Search reels, tags or files..."
              className="bg-transparent border-none text-xs text-zinc-100 outline-none w-full placeholder-zinc-500"
            />
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Notification Placeholder */}
            <button
              aria-label="Notifications"
              className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg transition-all relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-zinc-100 rounded-full ring-2 ring-zinc-950" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="User profile menu"
                className="flex items-center gap-2 p-1.5 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/50 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-200 border border-zinc-700/30">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1.5 z-40 text-xs"
                    >
                      <div className="px-3.5 py-2.5 border-b border-zinc-800/60 mb-1.5">
                        <p className="font-semibold text-zinc-200">ReelPilot Creator</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">j6777416@gmail.com</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors border-t border-zinc-800/40 mt-1.5"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Log Out
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area Container */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
