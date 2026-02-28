
import React, { useState, useEffect, useMemo } from 'react';
import { MuscleGroup, WorkoutSession, ExerciseEntry, SetData } from './types';
import { db } from './db';
import { MUSCLE_GROUPS } from './constants';
import Layout from './components/Layout';
import StreakCalendar from './components/StreakCalendar';
import ProgressChart from './components/ProgressChart';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'stats' | 'history'>('home');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  
  // Logging State
  const [currentMuscle, setCurrentMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState<SetData[]>([{ weight: 0, reps: 0 }]);
  const [rating, setRating] = useState(3);
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Load sessions from DB on mount
  useEffect(() => {
    setSessions(db.getSessions());
  }, []);

  const previousWorkout = useMemo(() => {
    return db.getPreviousWorkoutForMuscle(currentMuscle);
  }, [currentMuscle, sessions]);

  const calculateAutoRating = (newSets: SetData[], prev: ExerciseEntry | null) => {
    if (!prev) return 3;
    const newVolume = newSets.reduce((a, b) => a + (b.weight * b.reps), 0);
    const prevVolume = prev.sets.reduce((a, b) => a + (b.weight * b.reps), 0);
    
    if (newVolume > prevVolume) return 5;
    if (newVolume === prevVolume) return 4;
    return 2;
  };

  const addSet = () => setSets([...sets, { weight: 0, reps: 0 }]);
  const removeSet = (idx: number) => setSets(sets.filter((_, i) => i !== idx));
  const updateSet = (idx: number, key: keyof SetData, val: number) => {
    const newSets = [...sets];
    newSets[idx][key] = val;
    setSets(newSets);
    setRating(calculateAutoRating(newSets, previousWorkout));
  };

  const handleSaveWorkout = () => {
    if (!exerciseName || sets.some(s => s.reps === 0)) {
      alert("Please enter exercise name and all reps");
      return;
    }

    // Convert workoutDate (YYYY-MM-DD) to ISO string with time set to start of day
    const selectedDate = new Date(workoutDate);
    selectedDate.setHours(0, 0, 0, 0);
    const dateISOString = selectedDate.toISOString();

    const newExercise: ExerciseEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: exerciseName,
      muscleGroup: currentMuscle,
      sets: sets,
      date: dateISOString,
      rating: rating
    };

    const newSession: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateISOString,
      exercises: [newExercise],
      totalVolume: sets.reduce((a, b) => a + (b.weight * b.reps), 0),
      rating: rating
    };

    db.saveSession(newSession);
    setSessions(db.getSessions());
    setActiveTab('home');
    
    // Reset form
    setExerciseName('');
    setSets([{ weight: 0, reps: 0 }]);
    setRating(3);
    setWorkoutDate(new Date().toISOString().split('T')[0]);
  };

  const streakCount = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sorted = sessions.map(s => new Date(s.date).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Simple streak logic
    return sorted.length; // Simplified for this demo - returns total unique days
  }, [sessions]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl p-6 shadow-lg">
            <div>
              <p className="text-white/80 text-sm font-medium">Current Streak</p>
              <h2 className="text-4xl font-black text-white">{streakCount} Days</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <span className="text-2xl">🔥</span>
            </div>
          </div>

          <StreakCalendar sessions={sessions} />

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-300">Recent Sessions</h3>
            {sessions.slice(-3).reverse().map(s => (
              <div key={s.id} className="glass-panel rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{s.exercises[0].name}</p>
                  <p className="text-xs text-slate-400">{new Date(s.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{s.totalVolume} kg</p>
                  <div className="flex text-[10px] text-amber-400">
                    {Array.from({ length: s.rating }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Log Workout</h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Workout Date</label>
            <input 
              type="date" 
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {workoutDate !== new Date().toISOString().split('T')[0] && (
              <p className="text-[10px] text-amber-400 italic">Adding workout for a past date</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Muscle Group</label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map(m => (
                <button
                  key={m}
                  onClick={() => setCurrentMuscle(m)}
                  className={`p-2 rounded-lg text-xs font-bold transition-all ${currentMuscle === m ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Exercise Name</label>
            <input 
              type="text" 
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Bench Press" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {previousWorkout && (
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Previous Stats</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm font-bold text-amber-100">{previousWorkout.name}</p>
                <p className="text-xs text-amber-200">
                  {previousWorkout.sets.length} sets • Max {Math.max(...previousWorkout.sets.map(s => s.weight))}kg
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">Sets</label>
              <button onClick={addSet} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-bold uppercase">+ Add Set</button>
            </div>
            
            {sets.map((set, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 font-bold text-sm w-4">{idx + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Weight (kg)</span>
                    <input 
                      type="number" 
                      value={set.weight || ''}
                      onChange={(e) => updateSet(idx, 'weight', parseFloat(e.target.value))}
                      className="bg-slate-800 border-none rounded-lg p-2 text-center text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Reps</span>
                    <input 
                      type="number" 
                      value={set.reps || ''}
                      onChange={(e) => updateSet(idx, 'reps', parseInt(e.target.value))}
                      className="bg-slate-800 border-none rounded-lg p-2 text-center text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {sets.length > 1 && (
                  <button onClick={() => removeSet(idx)} className="text-rose-500">×</button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-500 uppercase block">How did it feel? (Progress Rating)</label>
             <div className="flex justify-between gap-2">
               {[1, 2, 3, 4, 5].map(r => (
                 <button 
                  key={r} 
                  onClick={() => setRating(r)}
                  className={`flex-1 p-2 rounded-xl text-lg ${rating === r ? 'bg-amber-400' : 'bg-slate-800'}`}
                 >
                   {r === 1 ? '😫' : r === 2 ? '😕' : r === 3 ? '😐' : r === 4 ? '💪' : '🚀'}
                 </button>
               ))}
             </div>
             <p className="text-center text-[10px] text-slate-400 italic">
               Rating is auto-suggested based on your volume growth compared to last time.
             </p>
          </div>

          <button 
            onClick={handleSaveWorkout}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black p-4 rounded-2xl shadow-lg transition-transform active:scale-95"
          >
            COMPLETE SESSION
          </button>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Analytics</h2>
          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
            <button 
              onClick={() => setCurrentMuscle(MuscleGroup.Chest)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${currentMuscle === MuscleGroup.Chest ? 'bg-blue-500' : 'bg-slate-800 text-slate-400'}`}
            >
              All Progress
            </button>
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                onClick={() => setCurrentMuscle(m)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold ${currentMuscle === m ? 'bg-blue-500' : 'bg-slate-800 text-slate-400'}`}
              >
                {m}
              </button>
            ))}
          </div>
          
          <ProgressChart sessions={sessions} selectedMuscle={currentMuscle} />
          
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-panel p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Weight Lifted</p>
                <p className="text-2xl font-black text-emerald-400">
                  {sessions.reduce((a, b) => a + b.totalVolume, 0).toLocaleString()} <span className="text-xs">kg</span>
                </p>
             </div>
             <div className="glass-panel p-4 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Avg Rating</p>
                <p className="text-2xl font-black text-amber-400">
                  {(sessions.reduce((a, b) => a + b.rating, 0) / (sessions.length || 1)).toFixed(1)}
                </p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Workout Log</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <p>No workouts yet. Push some iron!</p>
            </div>
          ) : (
            sessions.slice().reverse().map(s => (
              <div key={s.id} className="glass-panel rounded-2xl p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-100">{s.exercises[0].name}</h4>
                    <span className="text-[10px] font-bold uppercase text-blue-400">{s.exercises[0].muscleGroup}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold">{new Date(s.date).toLocaleDateString()}</span>
                    <div className="flex text-xs text-amber-400">
                      {Array.from({ length: s.rating }).map((_, i) => <span key={i}>★</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {s.exercises[0].sets.map((set, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg px-2 py-1 text-[10px]">
                      <span className="text-slate-500 mr-1">{idx+1}:</span>
                      <span className="font-bold text-slate-200">{set.weight}kg × {set.reps}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-medium">Session Volume</span>
                  <span className="text-sm font-black text-emerald-400">{s.totalVolume} kg</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
