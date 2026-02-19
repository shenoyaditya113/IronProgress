
import React from 'react';
import { MuscleGroup } from './types';

export const MUSCLE_GROUPS = Object.values(MuscleGroup);

export const ICONS = {
  Add: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Chart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  History: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Dumbbell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M20.25 11.25H21a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-.75V5.25a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 0-.75.75v1.5H15.75V3.75a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 0-.75.75v3h-1.5v-3a.75.75 0 0 0-.75-.75H7.5a.75.75 0 0 0-.75.75v1.5H5.25v-1.5a.75.75 0 0 0-.75-.75H2.25a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 .75.75H3v.75H2.25a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 .75.75H3v1.5a.75.75 0 0 0 .75.75H6a.75.75 0 0 0 .75-.75v-1.5h1.5v3a.75.75 0 0 0 .75.75h2.25a.75.75 0 0 0 .75-.75v-3h1.5v3a.75.75 0 0 0 .75.75H15a.75.75 0 0 0 .75-.75v-1.5h1.5v1.5a.75.75 0 0 0 .75.75h2.25a.75.75 0 0 0 .75-.75v-1.5h.75a.75.75 0 0 0 .75-.75v-3a.75.75 0 0 0-.75-.75h-.75v-.75Z" />
    </svg>
  )
};
