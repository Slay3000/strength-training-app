import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import WorkoutSummary from './components/WorkoutSummary'
import Preferences from './components/Preferences'
import AddExerciseForm from './components/AddExerciseForm'
import TargetsForm from './components/TargetsForm'
import {
    computePrevStatsBySectionAndExercise,
    computeWeeklySectionAverages,
} from './helpers/workout'
import './App.css'

export default function App() {
    const [workouts, setWorkouts] = useState([])
    const [tab, setTab] = useState('current')
    const [hiddenExercises, setHiddenExercises] = useState([])

    // persistent workout form state
    const [formEntries, setFormEntries] = useState([
        { exerciseId: '', reps: '', weight: '' },
    ])
    const [formSearchTerms, setFormSearchTerms] = useState([''])
    const [formDropdownOpen, setFormDropdownOpen] = useState([false])

    const [muscleTargets, setMuscleTargets] = useState({})

    const [USER_ID, setUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showWorkoutTip, setShowWorkoutTip] = useState(true)
    const [showThisWeekTip, setShowThisWeekTip] = useState(true)

    // login session
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

    // Fetch workouts + muscle targets after login
    useEffect(() => {
        if (!USER_ID) return
        fetchWorkouts()
        fetchMuscleTargets()
    }, [USER_ID])

    async function fetchMuscleTargets() {
        const { data, error } = await supabase
            .from('muscle_targets')
            .select('muscle, ratio')
            .eq('user_id', USER_ID)

        if (error) {
            console.error(error)
            return
        }

        if (data.length > 0) {
            setMuscleTargets(
                Object.fromEntries(data.map((r) => [r.muscle, r.ratio])),
            )
        } else {
            const defaults = {
                Legs: 2.0,
                Back: 1.0,
                Chest: 1.0,
                Arms: 0.5,
                Shoulders: 0.5,
            }
            setMuscleTargets(defaults)

            const rows = Object.entries(defaults).map(([muscle, ratio]) => ({
                user_id: USER_ID,
                muscle,
                ratio,
            }))
            await supabase.from('muscle_targets').upsert(rows)
        }
    }

    async function saveTargetsToDB(updated) {
        const rows = Object.entries(updated).map(([muscle, ratio]) => ({
            user_id: USER_ID,
            muscle,
            ratio,
        }))

        await supabase.from('muscle_targets').upsert(rows, {
            onConflict: 'user_id,muscle',
        })

        setMuscleTargets(updated)
    }

    async function fetchWorkouts() {
        const { data, error } = await supabase
            .from('workouts')
            .select(
                'id, reps, weight, created_at, exercise_id, exercises(name, type)',
            )
            .eq('user_id', USER_ID)
            .order('created_at', { ascending: false })

        if (!error) setWorkouts(data || [])
        else console.error(error)
    }

    async function handleAddEntries(entries) {
        const editing = entries.find((e) => e._editingId)

        if (editing) {
            const { data, error } = await supabase
                .from('workouts')
                .update({
                    exercise_id: editing.exerciseId,
                    reps: parseInt(editing.reps),
                    weight: parseFloat(editing.weight),
                })
                .eq('id', editing._editingId)
                .select(
                    'id, reps, weight, created_at, exercise_id, exercises(name, type)',
                )

            if (!error) {
                setWorkouts((prev) =>
                    prev.map((w) =>
                        w.id === editing._editingId ? data[0] : w,
                    ),
                )
            }
            return
        }

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

        if (!error) setWorkouts((prev) => [...data, ...prev])
    }

    async function handleDelete(id) {
        const { error } = await supabase.from('workouts').delete().eq('id', id)
        if (!error) setWorkouts(workouts.filter((w) => w.id !== id))
    }

    function handleEdit(workout) {
        setFormEntries([
            {
                exerciseId: workout.exercise_id,
                reps: workout.reps.toString(),
                weight: workout.weight.toString(),
                _editingId: workout.id,
            },
        ])
        setFormSearchTerms([workout.exercises?.name || ''])
        setFormDropdownOpen([false])
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

    if (!USER_ID) {
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
    }

    // TODAY STATS
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayWorkouts = workouts.filter(
        (w) => w.created_at.slice(0, 10) === todayStr,
    )
    const todayLoad = todayWorkouts.reduce(
        (sum, w) => sum + (w.weight || 0) * (w.reps || 0),
        0,
    )

    // weekly stats
    const prevStats = computePrevStatsBySectionAndExercise(workouts, todayStr)
    const weeklyAverages = computeWeeklySectionAverages(workouts)
    const currentWeekLoads = weeklyAverages?.sections || {}
    const prevWeekAvg = weeklyAverages?.overall?.previousWeekAvg || 0
    const toGoToday = prevWeekAvg - todayLoad
    const lastWeekLoads = weeklyAverages?.sections || {}

    const totalLastWeek = Object.values(lastWeekLoads).reduce(
        (sum, sec) => sum + (sec.previousWeekAvg || 0),
        0,
    )

    const targetSum = Object.values(muscleTargets).reduce((a, b) => a + b, 0)

    const targetProportions = Object.fromEntries(
        Object.entries(muscleTargets).map(([muscle, ratio]) => [
            muscle,
            ratio / targetSum,
        ]),
    )

    const actualProportions = Object.fromEntries(
        Object.entries(lastWeekLoads).map(([muscle, sec]) => {
            const load = sec.previousWeekAvg || 0
            return [muscle, totalLastWeek > 0 ? load / totalLastWeek : 0]
        }),
    )

    const imbalance = Object.entries(targetProportions).map(
        ([muscle, targetPercent]) => ({
            muscle,
            diffPercent: (actualProportions[muscle] || 0) - targetPercent,
            actualPercent: actualProportions[muscle] || 0,
            targetPercent,
        }),
    )

    const undertrained = imbalance
        .filter((x) => x.diffPercent < -0.05)
        .sort((a, b) => a.diffPercent - b.diffPercent)

    let workoutTip =
        undertrained.length > 0
            ? `Tip: Last week lacked focus on ${undertrained
                  .map((m) => m.muscle)
                  .join(', ')}. Prioritize these muscles today.`
            : 'Tip: Great balance last week! Keep it up 🔥'

    const totalThisWeek = Object.values(currentWeekLoads).reduce(
        (sum, sec) => sum + (sec.currentWeekAvg || 0),
        0,
    )
    const currentProportions = Object.fromEntries(
        Object.entries(currentWeekLoads).map(([muscle, sec]) => {
            const load = sec.currentWeekAvg || 0
            return [muscle, totalThisWeek > 0 ? load / totalThisWeek : 0]
        }),
    )

    const actualProportionsThisWeek = Object.fromEntries(
        Object.entries(currentWeekLoads).map(([muscle, sec]) => {
            const load = sec.currentWeekAvg || 0
            return [muscle, totalThisWeek > 0 ? load / totalThisWeek : 0]
        }),
    )

    const differenceProportions = Object.fromEntries(
        Object.entries(targetProportions).map(([muscle, targetPercent]) => {
            const actual = currentProportions[muscle] || 0
            return [muscle, actual - targetPercent] // positive = overtrained
        }),
    )
    const neededProportions = Object.fromEntries(
        Object.entries(targetProportions).map(([muscle, targetPercent]) => {
            const actual = currentProportions[muscle] || 0
            return [muscle, targetPercent - actual]
        }),
    )

    const imbalanceThisWeek = Object.entries(targetProportions).map(
        ([muscle, targetPercent]) => ({
            muscle,
            diffPercent:
                (actualProportionsThisWeek[muscle] || 0) - targetPercent,
            actualPercent: actualProportionsThisWeek[muscle] || 0,
            targetPercent,
        }),
    )

    const undertrainedThisWeek = imbalanceThisWeek
        .filter((x) => x.diffPercent < -0.05)
        .sort((a, b) => a.diffPercent - b.diffPercent)

    let thisWeekTip =
        undertrainedThisWeek.length > 0
            ? `This Week Tip: You undertrained ${undertrainedThisWeek
                  .map((t) => t.muscle)
                  .join(', ')} so far. Focus on them today.`
            : 'This Week Tip: This week is well balanced so far. Great job 🔥'

    return (
        <div className="app-container">
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
                    className={tab === 'targets' ? 'active' : ''}
                    onClick={() => setTab('targets')}
                >
                    Targets
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
                            entries={formEntries}
                            setEntries={setFormEntries}
                            searchTerms={formSearchTerms}
                            setSearchTerms={setFormSearchTerms}
                            dropdownOpen={formDropdownOpen}
                            setDropdownOpen={setFormDropdownOpen}
                        />

                        <WorkoutList
                            workouts={workouts}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            hideDate={true}
                            prevStats={prevStats}
                            weekStart={
                                new Date(new Date().setHours(0, 0, 0, 0))
                            }
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

                <TargetsForm
                    muscleTargets={muscleTargets}
                    currentProportions={currentProportions}
                    targetProportions={targetProportions}
                    onSave={saveTargetsToDB}
                />

                {tab === 'add-exercise' && <AddExerciseForm />}
            </div>
        </div>
    )
}
