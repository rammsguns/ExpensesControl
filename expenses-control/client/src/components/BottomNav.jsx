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
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors duration-150 ease-in-out rounded-lg mx-0.5 my-1 ${
                isActive 
                  ? 'text-indigo-600 bg-indigo-50/60' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/60'
              }`}
              aria-label={language === 'es' ? tab.labelEs : tab.labelEn}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon size={24} className="mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[11px] font-medium leading-tight ${isActive ? 'text-indigo-600' : ''}`}>
                {language === 'es' ? tab.labelEs : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
