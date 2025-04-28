import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, ClipboardCheck, User, Menu, X } from 'lucide-react';
import { ConfirmDialog } from '../ui/Dialog';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  if (!user) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <ClipboardCheck className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">TaskHub</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-700">
                  Hello, {user.name}
                </p>
              </div>
              
              <button
                onClick={() => setIsLogoutDialogOpen(true)}
                className="ml-2 p-1 rounded-full text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, toggle based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2 text-gray-700">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                <span className="font-medium">{user.name}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            </div>
            
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsLogoutDialogOpen(true);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-2" />
                <span>Sign out</span>
              </div>
            </button>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={signOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
      />
    </header>
  );
};

export default Header;