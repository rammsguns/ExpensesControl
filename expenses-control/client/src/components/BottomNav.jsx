import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { Home, Users, Clock, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, labelEn: 'Groups', labelEs: 'Grupos' },
  { path: '/friends', icon: Users, labelEn: 'Friends', labelEs: 'Amigos' },
  { path: '/activity', icon: Clock, labelEn: 'Activity', labelEs: 'Actividad' },
  { path: '/account', icon: User, labelEn: 'Account', labelEs: 'Cuenta' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-3 transition ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={24} className="mb-1" />
              <span className="text-xs font-medium">
                {language === 'es' ? tab.labelEs : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
