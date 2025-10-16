import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import WorkoutSummary from './components/WorkoutSummary'
import Preferences from './components/Preferences'
import AddExerciseForm from './components/AddExerciseForm'
import { computePrevStatsBySectionAndExercise } from './helpers/workout'
import './App.css'

export default function App() {
    const [workouts, setWorkouts] = useState([])
    const [exerciseId, setExerciseId] = useState('')
    const [reps, setReps] = useState('')
    const [weight, setWeight] = useState('')
    const [tab, setTab] = useState('current')
    const [hiddenExercises, setHiddenExercises] = useState([])
    const [editingId, setEditingId] = useState(null)

    const [USER_ID, setUserId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

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
                'id, reps, weight, created_at, exercise_id, exercises(name, type)'
            )
            .eq('user_id', USER_ID)
            .order('created_at', { ascending: false })
        if (error) console.error(error)
        else setWorkouts(data || [])
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
                .select('id, reps, weight, created_at, exercises(name, type)')

            if (error) console.error(error)
            else
                setWorkouts(
                    workouts.map((w) => (w.id === editingId ? data[0] : w))
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
    const todayStr = new Date().toISOString().split('T')[0]
    const todayWorkouts = workouts.filter(
        (w) => w.created_at.slice(0, 10) === todayStr
    )
    const currentDate = new Date().toLocaleDateString()

    // Call it
    const prevStats = computePrevStatsBySectionAndExercise(
        workouts,
        currentDate
    )

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
                        <WorkoutForm
                            exerciseId={exerciseId}
                            setExerciseId={setExerciseId}
                            reps={reps}
                            setReps={setReps}
                            weight={weight}
                            setWeight={setWeight}
                            onAdd={handleAddOrEdit}
                            hiddenExercises={hiddenExercises}
                        />
                        <WorkoutList
                            workouts={todayWorkouts}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            hideDate={true}
                            prevStats={prevStats} // <-- both section & exercise stats
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
