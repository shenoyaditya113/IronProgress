
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MuscleGroup, WorkoutSession } from '../types';

interface ProgressChartProps {
  sessions: WorkoutSession[];
  selectedMuscle: MuscleGroup | 'All';
}

const ProgressChart: React.FC<ProgressChartProps> = ({ sessions, selectedMuscle }) => {
  const data = sessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => {
      const filteredExercises = selectedMuscle === 'All' 
        ? s.exercises 
        : s.exercises.filter(e => e.muscleGroup === selectedMuscle);
        
      const volume = filteredExercises.reduce((acc, curr) => 
        acc + curr.sets.reduce((sAcc, sCurr) => sAcc + (sCurr.weight * sCurr.reps), 0), 0
      );
      
      const maxWeight = filteredExercises.length > 0
        ? Math.max(...filteredExercises.map(e => Math.max(...e.sets.map(set => set.weight))))
        : 0;

      return {
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume,
        maxWeight,
      };
    })
    .filter(d => d.volume > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
        <p>No data for {selectedMuscle}</p>
        <p className="text-xs">Start logging to see charts</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 h-[350px]">
      <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        Progressive Overload Tracking
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
          <YAxis stroke="#94a3b8" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="volume" 
            name="Total Volume (kg)"
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10b981' }} 
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            dataKey="maxWeight" 
            name="Max Weight (kg)"
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#3b82f6' }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
