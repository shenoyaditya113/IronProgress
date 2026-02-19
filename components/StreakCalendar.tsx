
import React from 'react';

interface StreakCalendarProps {
  sessions: { date: string }[];
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ sessions }) => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  const workoutDates = new Set(sessions.map(s => new Date(s.date).toDateString()));
  const monthName = today.toLocaleString('default', { month: 'long' });

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-200">{monthName}</h3>
        <span className="text-xs bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded-full font-bold">
          {sessions.filter(s => new Date(s.date).getMonth() === today.getMonth()).length} Workouts
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-[10px] text-slate-500 font-bold mb-1">{day}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(today.getFullYear(), today.getMonth(), day);
          const isWorkout = workoutDates.has(date.toDateString());
          const isToday = date.toDateString() === today.toDateString();
          
          return (
            <div 
              key={day} 
              className={`h-8 flex items-center justify-center rounded-lg text-xs relative ${
                isWorkout ? 'bg-emerald-500 text-white font-bold' : 
                isToday ? 'border border-blue-400 text-blue-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakCalendar;
