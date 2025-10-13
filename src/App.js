import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import WorkoutSummary from './components/WorkoutSummary'
import Preferences from './components/Preferences'
import AddExerciseForm from './components/AddExerciseForm'

import './App.css'

// const USER_ID = '123e4567-e89b-12d3-a456-426614174000'

export default function App() {
    const [workouts, setWorkouts] = useState([])
    const [exerciseId, setExerciseId] = useState('')
    const [reps, setReps] = useState('')
    const [weight, setWeight] = useState('')
    const [tab, setTab] = useState('current') // current, history, summary, preferences
    const [hiddenExercises, setHiddenExercises] = useState([])
    const [editingId, setEditingId] = useState(null) // track editing workout

    const [USER_ID, setUserId] = useState(null) // Step 1: store logged-in user ID
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    // Step 1: get logged-in user on mount
    useEffect(() => {
        async function getUser() {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession()
            if (error) {
                console.error(error)
                setError('Failed to get session.')
            } else if (session?.user) {
                setUserId(session.user.id)
            }
            setLoading(false)
        }
        getUser()
    }, [])

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

    // Add or update workout
    async function handleAddOrEdit() {
        if (!exerciseId || !reps || !weight) return

        if (editingId) {
            // Update existing workout
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
            // Add new workout
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
    }

    // Delete workout
    async function handleDelete(id) {
        const { error } = await supabase.from('workouts').delete().eq('id', id)
        if (error) console.error(error)
        else setWorkouts(workouts.filter((w) => w.id !== id))
    }

    // Edit workout: populate form with selected workout
    function handleEdit(workout) {
        setExerciseId(workout.exercise_id)
        setReps(workout.reps)
        setWeight(workout.weight)
        setEditingId(workout.id)
        setTab('current') // switch to current tab
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
                <form
                    onSubmit={handleLogin} // handleLogin for sign-in
                    className="auth-form"
                >
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

    const todayWorkouts = workouts.filter((w) => {
        const today = new Date().toISOString().split('T')[0]
        const workoutDate = new Date(w.created_at).toISOString().split('T')[0]
        return workoutDate === today
    })

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

                        {todayWorkouts.length > 0 ? (
                            <WorkoutList
                                workouts={todayWorkouts}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                hideDate={true}
                            />
                        ) : (
                            <p className="no-workouts">
                                No workouts yet today.
                            </p>
                        )}
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
