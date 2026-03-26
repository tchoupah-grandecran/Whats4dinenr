"use client"; // Important car on utilise du React Context et des Hooks

import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/layout/AppShell';

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}