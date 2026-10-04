import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Menu, X, ShoppingCart, LogOut, Settings, BarChart3 } from 'lucide-react';
import { useBiscooboo } from './context';
import biscoobooLogo from '../assets/Biscooboo.png';

const Navbar = ({ bgColor, accentColor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, currentUser, isAdmin, logout, getCartItemCount } = useBiscooboo();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsAccountOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path, sectionRef) => {
    setIsMenuOpen(false);

    if (!isLoggedIn && (path === '/cart' || path === '/account' || path === '/orders')) {
      navigate('/login');
      return;
    }
    
    if (location.pathname === '/' && sectionRef) {
      // If on home page, scroll to the section
      setTimeout(() => {
        window.scrollRefs?.[sectionRef]?.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // Navigate to the path
      navigate(path);
    }
  };

  const navItems = [
    { label: 'MENU', path: '/', sectionRef: 'menuRef' },
    { label: 'ABOUT', path: '/', sectionRef: 'aboutRef' },
    { label: 'SHOP', path: '/', sectionRef: 'shopRef' },
    { label: 'CONTACT', path: '/', sectionRef: 'contactRef' }
  ];

  const cartCount = getCartItemCount();

  return (
    <div 
      className="w-full relative z-50 mb-0 backdrop-blur-sm border-b border-white/10"
      style={{
        backgroundColor: bgColor ? `${bgColor}cc` : 'rgba(26, 26, 26, 0.8)',
        backgroundImage: accentColor ? `radial-gradient(circle at center, ${accentColor}66 0%, ${bgColor}cc 80%)` : 'none'
      }}
    >
      <nav className="flex items-center justify-between px-6 py-6 md:px-12 container mx-auto">
        {/* Logo */}
        <Link to="/">
          <img 
            src={biscoobooLogo} 
            alt="BISCOOBOO" 
            className="h-8 md:h-5 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
          {navItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path, item.sectionRef)}
              className={`px-4 lg:px-6 py-2 text-xs lg:text-sm font-bold tracking-widest transition-all rounded-full cursor-pointer ${
                isActive(item.path)
                  ? 'bg-black/30 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Menu Toggle & Action Buttons Container */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-all"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                navigate('/login');
                return;
              }
              navigate('/cart');
            }}
            className="relative p-2.5 bg-white/10 backdrop-blur-lg rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Account Button with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="p-2.5 bg-white/10 backdrop-blur-lg rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all"
            >
              <User size={20} />
            </button>

            {/* Account Dropdown Menu */}
            {isAccountOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#3d2f29]/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
                <div className="p-4 space-y-2">
                  {!isLoggedIn ? (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-all text-sm block"
                      >
                        Login
                      </Link>
                      <div className="h-[1px] bg-white/10 my-2"></div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs text-white/60">Logged in as</p>
                        <p className="text-sm font-bold text-white truncate">
                          {currentUser?.name}
                        </p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setIsAccountOpen(false)}
                        className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-all text-sm block"
                      >
                        <Settings className="inline mr-2" size={14} />
                        Account Details
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsAccountOpen(false)}
                          className="w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg transition-all text-sm block"
                        >
                          <BarChart3 className="inline mr-2" size={14} />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm"
                      >
                        <LogOut className="inline mr-2" size={14} />
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#3d2f29]/80 backdrop-blur-md border-t border-white/10">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
            {navItems.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path, item.sectionRef)}
                className={`px-4 py-3 text-sm font-bold tracking-widest transition-all rounded-lg block w-full text-left ${
                  isActive(item.path)
                    ? 'text-white bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
