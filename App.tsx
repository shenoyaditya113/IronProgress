
import React, { useEffect, useMemo, useState } from 'react';
import { MuscleGroup, WorkoutSession, ExerciseEntry, SetData } from './types';
import { MUSCLE_GROUPS } from './constants';
import Layout from './components/Layout';
import StreakCalendar from './components/StreakCalendar';
import ProgressChart from './components/ProgressChart';
import { cloudDb } from './cloudDb';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'stats' | 'history'>('home');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Logging State
  const [currentMuscle, setCurrentMuscle] = useState<MuscleGroup>(MuscleGroup.Chest);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState<SetData[]>([{ weight: 0, reps: 0 }]);
  const [rating, setRating] = useState(3);
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [currentSessionExercises, setCurrentSessionExercises] = useState<ExerciseEntry[]>([]);
  
  // Set up auth state listener - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log('Auth state changed:', u ? `User: ${u.email}` : 'No user');
      setUser(u);
      setAuthReady(true);
    });
    
    return () => unsub();
  }, [authReady]);

  // Load sessions when user is available
  useEffect(() => {
    if (!authReady) return;

    if (user) {
      const unsub = cloudDb.subscribeSessions(user.uid, setSessions);
      return () => unsub();
    }

    // Firebase-only mode: no local fallback
    setSessions([]);
  }, [user, authReady]);

  const previousWorkout = useMemo(() => {
    // When editing, exclude the session being edited so "Previous Stats" doesn't show itself.
    const sorted = sessions
      .filter(s => s.id !== editingSessionId)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const session of sorted) {
      const exercise = session.exercises.find(e => e.muscleGroup === currentMuscle);
      if (exercise) return exercise;
    }
    return null;
  }, [currentMuscle, sessions, editingSessionId]);

  const sortedSessions = useMemo(() => {
    return sessions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

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

  const resetLogForm = () => {
    setExerciseName('');
    setSets([{ weight: 0, reps: 0 }]);
    setRating(3);
    setWorkoutDate(new Date().toISOString().split('T')[0]);
    setEditingSessionId(null);
    setCurrentSessionExercises([]);
  };

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      setAuthError((e as any)?.message ?? 'Google sign-in failed.');
      alert('Google sign-in failed. Check Firebase Auth (Google provider enabled, domain authorized).');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    resetLogForm();
    setActiveTab('home');
  };

  const startEditSession = (session: WorkoutSession) => {
    const ex = session.exercises[0];
    setEditingSessionId(session.id);
    setWorkoutDate(new Date(session.date).toISOString().split('T')[0]);
    setCurrentMuscle(ex.muscleGroup);
    setExerciseName(ex.name);
    setSets(ex.sets);
    setRating(session.rating);
    // Preserve any additional exercises in the session so they don't get lost on save
    setCurrentSessionExercises(session.exercises.slice(1));
    setActiveTab('log');
  };

  const deleteSession = (session: WorkoutSession) => {
    if (!user) {
      alert('Please sign in to manage your workouts.');
      return;
    }
    const ex = session.exercises[0];
    const ok = confirm(`Delete this session?\n\n${ex.name} • ${new Date(session.date).toLocaleDateString()}`);
    if (!ok) return;

    // If you're currently editing this one, exit edit mode.
    if (editingSessionId === session.id) {
      resetLogForm();
    }

    cloudDb.deleteSession(user.uid, session.id).catch((e) => {
      console.error(e);
      alert('Failed to delete session.');
    });
  };

  const addExerciseToCurrentSession = () => {
    if (!exerciseName || sets.some(s => s.reps === 0)) {
      alert('Please enter exercise name and all reps before adding an exercise to the session');
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
      rating: rating,
    };

    setCurrentSessionExercises(prev => [...prev, newExercise]);

    // Reset form for next exercise while keeping date and muscle group
    setExerciseName('');
    setSets([{ weight: 0, reps: 0 }]);
    setRating(3);
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      alert('Please sign in to save workouts to the cloud.');
      return;
    }

    // If there is no exercise yet and nothing typed, prevent empty session
    if (!exerciseName && currentSessionExercises.length === 0) {
      alert('Add at least one exercise to complete a session.');
      return;
    }

    // Convert workoutDate (YYYY-MM-DD) to ISO string with time set to start of day
    const selectedDate = new Date(workoutDate);
    selectedDate.setHours(0, 0, 0, 0);
    const dateISOString = selectedDate.toISOString();

    // Build the \"current\" exercise from the form if it is filled
    let currentExercise: ExerciseEntry | null = null;
    if (exerciseName) {
      if (sets.some(s => s.reps === 0)) {
        alert('Please enter reps for all sets');
        return;
      }
      currentExercise = {
        id: Math.random().toString(36).substr(2, 9),
        name: exerciseName,
        muscleGroup: currentMuscle,
        sets: sets,
        date: dateISOString,
        rating: rating,
      };
    }

    if (editingSessionId) {
      const existing = sessions.find(s => s.id === editingSessionId);
      if (!existing) {
        alert("Couldn't find the session to edit. Please try again.");
        setEditingSessionId(null);
        return;
      }

      const existingExercise = existing.exercises[0];
      const updatedFirstExercise: ExerciseEntry = {
        ...existingExercise,
        name: exerciseName || existingExercise.name,
        muscleGroup: currentMuscle,
        sets: sets,
        date: dateISOString,
        rating: rating,
      };

      const updatedExercises: ExerciseEntry[] = [
        updatedFirstExercise,
        ...currentSessionExercises,
      ];

      const totalVolume = updatedExercises.reduce(
        (acc, ex) => acc + ex.sets.reduce((a, b) => a + b.weight * b.reps, 0),
        0
      );
      const sessionRating =
        updatedExercises.reduce((acc, ex) => acc + ex.rating, 0) /
        (updatedExercises.length || 1);

      const updatedSession: WorkoutSession = {
        ...existing,
        date: dateISOString,
        exercises: updatedExercises,
        totalVolume,
        rating: sessionRating,
      };

      await cloudDb.updateSession(user.uid, updatedSession);
      setActiveTab('history');
      resetLogForm();
      return;
    }

    const allExercises: ExerciseEntry[] = [
      ...currentSessionExercises,
      ...(currentExercise ? [currentExercise] : []),
    ];

    const totalVolume = allExercises.reduce(
      (acc, ex) => acc + ex.sets.reduce((a, b) => a + b.weight * b.reps, 0),
      0
    );
    const sessionRating =
      allExercises.reduce((acc, ex) => acc + ex.rating, 0) /
      (allExercises.length || 1);

    const newSession: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateISOString,
      exercises: allExercises,
      totalVolume,
      rating: sessionRating,
    };

    await cloudDb.saveSession(user.uid, newSession);
    setActiveTab('home');
    resetLogForm();
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
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      headerRight={
        authReady ? (
          user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-slate-400 font-bold max-w-[140px] truncate">
                {user.email ?? 'Signed in'}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-black uppercase"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl font-black uppercase"
            >
              Sign in
            </button>
          )
        ) : null
      }
    >
      {!user && authReady && (
        <div className="glass-panel rounded-2xl p-4 border border-white/10 mb-4">
          <p className="text-sm font-bold text-slate-200">Signing you in…</p>
          <p className="text-xs text-slate-400 mt-1">
            This app requires Google sign-in to use Firebase storage.
          </p>
          {authError && (
            <p className="text-xs text-rose-300 mt-2 break-words">
              Auth error: {authError}
            </p>
          )}
        </div>
      )}

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
            {sortedSessions.slice(0, 3).map(s => (
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

          {!editingSessionId && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={addExerciseToCurrentSession}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold p-3 rounded-2xl text-xs uppercase tracking-wide"
              >
                Add Exercise To Session
              </button>
              {currentSessionExercises.length > 0 && (
                <div className="glass-panel rounded-2xl p-3 border border-blue-500/30">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Exercises in this session ({currentSessionExercises.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                    {currentSessionExercises.map((ex, idx) => (
                      <div key={ex.id} className="flex justify-between items-center text-slate-300">
                        <span className="truncate max-w-[55%]">
                          {idx + 1}. {ex.name} ({ex.muscleGroup})
                        </span>
                        <span className="text-slate-500">
                          {ex.sets.reduce((a, b) => a + b.weight * b.reps, 0)} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleSaveWorkout}
            disabled={!user}
            className={`w-full font-black p-4 rounded-2xl shadow-lg transition-transform active:scale-95 ${
              user ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {editingSessionId ? 'UPDATE SESSION' : 'COMPLETE SESSION'}
          </button>

          {!user && (
            <p className="text-center text-[10px] text-amber-400 italic">
              Sign in to save workouts to Firebase.
            </p>
          )}

          {editingSessionId && (
            <button
              onClick={resetLogForm}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold p-3 rounded-2xl transition-transform active:scale-95"
            >
              Cancel Edit
            </button>
          )}
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
            sortedSessions.map(s => (
              <div key={s.id} className="glass-panel rounded-2xl p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-100">{s.exercises[0].name}</h4>
                    <span className="text-[10px] font-bold uppercase text-blue-400">{s.exercises[0].muscleGroup}</span>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEditSession(s)}
                        className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-bold uppercase"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSession(s)}
                        className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-1 rounded font-bold uppercase"
                      >
                        Delete
                      </button>
                      <span className="text-[10px] text-slate-500 font-bold">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
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
