import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

const tabs = [
  { path: '/', icon: '🏠', labelEn: 'Groups', labelEs: 'Grupos' },
  { path: '/friends', icon: '👥', labelEn: 'Friends', labelEs: 'Amigos' },
  { path: '/activity', icon: '📋', labelEn: 'Activity', labelEs: 'Actividad' },
  { path: '/account', icon: '👤', labelEn: 'Account', labelEs: 'Cuenta' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-2 transition ${
                isActive ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">
                {language === 'es' ? tab.labelEs : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}