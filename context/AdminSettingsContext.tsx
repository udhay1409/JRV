'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AdminSettings {
  color: string;
}

const defaultSettings: AdminSettings = {
  color: '#FFC933',
};

const AdminSettingsContext = createContext<AdminSettings>(defaultSettings);

interface AdminSettingsProviderProps {
  children: ReactNode;
}

export const AdminSettingsProvider: React.FC<AdminSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/hotelColor');
        const data = await response.json();
        setSettings(data);
        
        if (data.color) {
          document.documentElement.style.setProperty('--hotel-primary', data.color);
        }
      } catch (error) {
        console.error('Failed to fetch admin settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return ( 
    <AdminSettingsContext.Provider value={settings}>
      {children}
    </AdminSettingsContext.Provider>
  );
};

export const useAdminSettings = (): AdminSettings => {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
};
