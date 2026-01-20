import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import WorkoutSummary from './components/WorkoutSummary'
import Preferences from './components/Preferences'
import AddExerciseForm from './components/AddExerciseForm'
import {
    computePrevStatsBySectionAndExercise,
    computeWeeklySectionAverages,
} from './helpers/workout'
import './App.css'

const MUSCLE_TARGETS = {
    Legs: 2.0, // 200%
    Back: 1.0, // 100%
    Chest: 1.0, // 100%
    Arms: 0.5, // 50%
    Shoulders: 0.5, // 50%
}

export default function App() {
    const [workouts, setWorkouts] = useState([])
    const [exerciseId, setExerciseId] = useState('')
    const [reps, setReps] = useState('')
    const [weight, setWeight] = useState('')
    const [entries, setEntries] = useState([
        { exercise: null, weight: '', reps: '' },
    ])
    const [tab, setTab] = useState('current')
    const [hiddenExercises, setHiddenExercises] = useState([])
    const [editingId, setEditingId] = useState(null)

    const [USER_ID, setUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showWorkoutTip, setShowWorkoutTip] = useState(true)
    const [showThisWeekTip, setShowThisWeekTip] = useState(true)

    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday ...
    const diffToMonday = (dayOfWeek + 6) % 7 // days to subtract to get Monday
    const weekStartDate = new Date(today)
    weekStartDate.setDate(today.getDate() - diffToMonday)
    weekStartDate.setHours(0, 0, 0, 0)
    // Get logged-in user session
    useEffect(() => {
        async function getUser() {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession()
            if (error) console.error(error)
            else if (session?.user) setUserId(session.user.id)
            setLoading(false)
        }
        getUser()
    }, [])

    // Fetch workouts when user is ready
    useEffect(() => {
        if (USER_ID) fetchWorkouts()
    }, [USER_ID])

    async function fetchWorkouts() {
        const { data, error } = await supabase
            .from('workouts')
            .select(
                'id, reps, weight, created_at, exercise_id, exercises(name, type)',
            )
            .eq('user_id', USER_ID)
            .order('created_at', { ascending: false })
        if (error) console.error(error)
        else setWorkouts(data || [])
    }

    async function handleAddEntries(entries) {
        const payload = entries.map((e) => ({
            user_id: USER_ID,
            exercise_id: e.exerciseId,
            reps: parseInt(e.reps),
            weight: parseFloat(e.weight),
        }))

        const { data, error } = await supabase
            .from('workouts')
            .insert(payload)
            .select(
                'id, reps, weight, created_at, exercise_id, exercises(name, type)',
            )

        if (error) {
            console.error(error)
            return
        }

        // prepend new workouts
        setWorkouts((prev) => [...data, ...prev])
    }

    // Add or edit workout
    async function handleAddOrEdit() {
        if (!exerciseId || !reps || !weight) return

        if (editingId) {
            const { data, error } = await supabase
                .from('workouts')
                .update({
                    exercise_id: exerciseId,
                    reps: parseInt(reps),
                    weight: parseFloat(weight),
                })
                .eq('id', editingId)
                .select(
                    'id, reps, weight, exercise_id, created_at, exercises(name, type)',
                )

            if (error) console.error(error)
            else
                setWorkouts(
                    workouts.map((w) => (w.id === editingId ? data[0] : w)),
                )

            setEditingId(null)
        } else {
            const { data, error } = await supabase
                .from('workouts')
                .insert([
                    {
                        user_id: USER_ID,
                        exercise_id: exerciseId,
                        reps: parseInt(reps),
                        weight: parseFloat(weight),
                    },
                ])
                .select('id, reps, weight, created_at, exercises(name, type)')

            if (error) console.error(error)
            else setWorkouts([data[0], ...workouts])
        }

        setReps('')
        setWeight('')
    }

    async function handleDelete(id) {
        const { error } = await supabase.from('workouts').delete().eq('id', id)
        if (error) console.error(error)
        else setWorkouts(workouts.filter((w) => w.id !== id))
    }

    function handleEdit(workout) {
        setExerciseId(workout.exercise_id)
        setReps(workout.reps)
        setWeight(workout.weight)
        setEditingId(workout.id)
        setTab('current')
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) setError(error.message)
        else if (data.user) setUserId(data.user.id)
    }

    if (loading) return <p>Loading...</p>
    if (!USER_ID)
        return (
            <div className="auth-container">
                <h2>Sign In / Sign Up</h2>
                <form onSubmit={handleLogin} className="auth-form">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Sign In</button>
                </form>
                {error && <p className="error">{error}</p>}
            </div>
        )

    // inside App.js, before return
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayWorkouts = workouts.filter(
        (w) => w.created_at.slice(0, 10) === todayStr,
    )
    const todayLoad = todayWorkouts.reduce(
        (sum, w) => sum + (w.weight || 0) * (w.reps || 0),
        0,
    )

    // Call it
    const prevStats = computePrevStatsBySectionAndExercise(workouts, todayStr)
    const weeklyAverages = computeWeeklySectionAverages(workouts)
    const currentWeekLoads = weeklyAverages?.sections || {}
    const prevWeekAvg = weeklyAverages?.overall?.previousWeekAvg || 0
    const toGoToday = prevWeekAvg - todayLoad
    const toGoTodaySigned = toGoToday > 0 ? toGoToday : 0
    const lastWeekLoads = weeklyAverages?.sections || {}
    const totalLastWeek = Object.values(lastWeekLoads).reduce(
        (sum, sec) => sum + (sec.previousWeekAvg || 0),
        0,
    )
    const targetSum = Object.values(MUSCLE_TARGETS).reduce((a, b) => a + b, 0)

    const targetProportions = Object.fromEntries(
        Object.entries(MUSCLE_TARGETS).map(([muscle, weight]) => [
            muscle,
            weight / targetSum,
        ]),
    )
    const actualProportions = Object.fromEntries(
        Object.entries(lastWeekLoads).map(([muscle, sec]) => {
            const load = sec.previousWeekAvg || 0
            return [muscle, totalLastWeek > 0 ? load / totalLastWeek : 0]
        }),
    )
    const imbalance = Object.entries(targetProportions).map(
        ([muscle, targetPercent]) => {
            const actualPercent = actualProportions[muscle] || 0
            const diffPercent = actualPercent - targetPercent
            return {
                muscle,
                diffPercent, // negative means undertrained
                actualPercent,
                targetPercent,
            }
        },
    )
    const undertrained = imbalance
        .filter((x) => x.diffPercent < -0.05) // 5% tolerance
        .sort((a, b) => a.diffPercent - b.diffPercent)

    let workoutTip = ''

    if (undertrained.length > 0) {
        const names = undertrained.map((m) => m.muscle).join(', ')
        workoutTip = `Tip: Last week lacked focus on ${names}. Prioritize these muscles today.`
    } else {
        workoutTip = 'Tip: Great balance last week! Keep it up 🔥'
    }

    const imbalanceCurrentWeek = Object.entries(MUSCLE_TARGETS).map(
        ([muscle, targetRatio]) => {
            const thisWeek = currentWeekLoads[muscle]?.currentWeekAvg || 0
            const normalized = thisWeek / targetRatio
            return { muscle, normalized, raw: thisWeek }
        },
    )
    const totalThisWeek = Object.values(currentWeekLoads).reduce(
        (sum, sec) => sum + (sec.currentWeekAvg || 0),
        0,
    )

    const actualProportionsThisWeek = Object.fromEntries(
        Object.entries(currentWeekLoads).map(([muscle, sec]) => {
            const load = sec.currentWeekAvg || 0
            return [muscle, totalThisWeek > 0 ? load / totalThisWeek : 0]
        }),
    )
    const imbalanceThisWeek = Object.entries(targetProportions).map(
        ([muscle, targetPercent]) => {
            const actualPercent = actualProportionsThisWeek[muscle] || 0
            const diffPercent = actualPercent - targetPercent
            return {
                muscle,
                diffPercent, // negative → undertrained
                actualPercent,
                targetPercent,
            }
        },
    )
    const undertrainedThisWeek = imbalanceThisWeek
        .filter((x) => x.diffPercent < -0.05) // 5% tolerance
        .sort((a, b) => a.diffPercent - b.diffPercent)
    let thisWeekTip = ''
    if (undertrainedThisWeek.length > 0) {
        const names = undertrainedThisWeek.map((t) => t.muscle).join(', ')
        thisWeekTip = `This Week Tip: You undertrained ${names} so far. Focus on them today.`
    } else {
        thisWeekTip =
            'This Week Tip: This week is well balanced so far. Great job 🔥'
    }
    return (
        <div className="app-container">
            {/* Tabs */}
            <div className="tabs">
                <button
                    className={tab === 'current' ? 'active' : ''}
                    onClick={() => setTab('current')}
                >
                    Current
                </button>
                <button
                    className={tab === 'history' ? 'active' : ''}
                    onClick={() => setTab('history')}
                >
                    History
                </button>
                <button
                    className={tab === 'summary' ? 'active' : ''}
                    onClick={() => setTab('summary')}
                >
                    Summary
                </button>
                <button
                    className={tab === 'preferences' ? 'active' : ''}
                    onClick={() => setTab('preferences')}
                >
                    Preferences
                </button>
                <button
                    className={tab === 'add-exercise' ? 'active' : ''}
                    onClick={() => setTab('add-exercise')}
                >
                    Add Exercise
                </button>
            </div>

            <div className="tab-content">
                {tab === 'current' && (
                    <>
                        {workoutTip && showWorkoutTip && (
                            <div className="workout-tip closable">
                                <span>{workoutTip}</span>
                                <button
                                    className="tip-close-button"
                                    onClick={() => setShowWorkoutTip(false)}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {thisWeekTip && showThisWeekTip && (
                            <div className="workout-tip secondary-tip closable">
                                <span>{thisWeekTip}</span>
                                <button
                                    className="tip-close-button"
                                    onClick={() => setShowThisWeekTip(false)}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <WorkoutForm
                            workouts={workouts}
                            onAdd={handleAddEntries}
                            hiddenExercises={hiddenExercises}
                        />

                        <WorkoutList
                            workouts={workouts}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            hideDate={true}
                            prevStats={prevStats} // contains sections, exercises, overall totals (from models)
                            weekStart={weekStartDate} // optional: for display
                            toGoToday={toGoToday}
                            todayLoad={todayLoad}
                            prevWeekAvg={prevWeekAvg}
                        />
                    </>
                )}

                {tab === 'history' && (
                    <WorkoutList workouts={workouts} onDelete={handleDelete} />
                )}
                {tab === 'summary' && <WorkoutSummary workouts={workouts} />}
                {tab === 'preferences' && (
                    <Preferences
                        hiddenExercises={hiddenExercises}
                        setHiddenExercises={setHiddenExercises}
                    />
                )}
                {tab === 'add-exercise' && <AddExerciseForm />}
            </div>
        </div>
    )
}
