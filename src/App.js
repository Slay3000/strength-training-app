import { useState, useEffect } from 'react'

// hooks
import { useAuth } from './hooks/useAuth'

// services
import {
    fetchWorkouts,
    insertWorkouts,
    updateWorkout,
    deleteWorkout,
} from './services/workoutsService'
import {
    fetchMuscleTargets,
    saveMuscleTargets,
} from './services/muscleTargetsService'

// helpers
import {
    computePrevStatsBySectionAndExercise,
    computeWeeklySectionAverages,
} from './helpers/workout'
import {
    computeTodayLoad,
    computeCurrentProportions,
    computeTargetProportions,
} from './helpers/weeklyStats'
import { getLastWeekTip, getThisWeekTip } from './helpers/tipHelpers'

// components
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import WorkoutSummary from './components/WorkoutSummary'
import Preferences from './components/Preferences'
import AddExerciseForm from './components/AddExerciseForm'
import TargetsForm from './components/TargetsForm'

import './App.css'

export default function App() {
    const { userId: USER_ID, loading } = useAuth()

    const [workouts, setWorkouts] = useState([])
    const [muscleTargets, setMuscleTargets] = useState({})
    const [hiddenExercises, setHiddenExercises] = useState([])

    const [tab, setTab] = useState('current')

    // Workout form persistent state
    const [formEntries, setFormEntries] = useState([
        { exerciseId: '', reps: '', weight: '' },
    ])
    const [formSearchTerms, setFormSearchTerms] = useState([''])
    const [formDropdownOpen, setFormDropdownOpen] = useState([false])

    const [showWorkoutTip, setShowWorkoutTip] = useState(true)
    const [showThisWeekTip, setShowThisWeekTip] = useState(true)

    // -----------------------------------------------------------
    // LOAD WORKOUTS + MUSCLE TARGETS
    // -----------------------------------------------------------
    useEffect(() => {
        if (!USER_ID) return

        async function loadData() {
            // Workouts
            const { data: workoutsData } = await fetchWorkouts(USER_ID)
            setWorkouts(workoutsData || [])

            // Targets
            const { data: targets } = await fetchMuscleTargets(USER_ID)
            if (targets?.length > 0) {
                setMuscleTargets(
                    Object.fromEntries(targets.map((t) => [t.muscle, t.ratio])),
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
                await saveMuscleTargets(USER_ID, defaults)
            }
        }

        loadData()
    }, [USER_ID])

    // -----------------------------------------------------------
    // AUTH + LOGIN SCREENS
    // -----------------------------------------------------------
    if (loading) return <p>Loading...</p>

    if (!USER_ID) {
        return (
            <div className="auth-container">
                <h2>Sign In / Sign Up</h2>
                <p>Please sign in to continue.</p>
            </div>
        )
    }

    // -----------------------------------------------------------
    // CALCULATIONS
    // -----------------------------------------------------------

    const today = new Date().toISOString().slice(0, 10)
    const todayLoad = computeTodayLoad(workouts, today)

    const prevStats = computePrevStatsBySectionAndExercise(workouts)
    const weeklyAverages = computeWeeklySectionAverages(workouts)

    const currentWeekLoads = weeklyAverages?.sections || {}
    const prevWeekAvg = weeklyAverages?.overall?.previousWeekAvg || 0
    const toGoToday = prevWeekAvg - todayLoad

    const targetProportions = computeTargetProportions(muscleTargets)
    const currentProportions = computeCurrentProportions(currentWeekLoads)

    // ---- Last Week Tip ----
    const lastWeekLoads = weeklyAverages?.sections || {}
    const totalLastWeek = Object.values(lastWeekLoads).reduce(
        (sum, sec) => sum + (sec.previousWeekAvg || 0),
        0,
    )

    const actualProportionsLastWeek = Object.fromEntries(
        Object.entries(lastWeekLoads).map(([muscle, sec]) => {
            const load = sec.previousWeekAvg || 0
            return [muscle, totalLastWeek > 0 ? load / totalLastWeek : 0]
        }),
    )

    const imbalanceLastWeek = Object.entries(targetProportions).map(
        ([muscle, target]) => ({
            muscle,
            diffPercent: (actualProportionsLastWeek[muscle] || 0) - target,
        }),
    )

    const undertrainedLastWeek = imbalanceLastWeek
        .filter((x) => x.diffPercent < -0.05)
        .sort((a, b) => a.diffPercent - b.diffPercent)

    const workoutTip = getLastWeekTip(undertrainedLastWeek)

    // ---- This Week Tip ----
    const imbalanceThisWeek = Object.entries(targetProportions).map(
        ([muscle, target]) => ({
            muscle,
            diffPercent: (currentProportions[muscle] || 0) - target,
        }),
    )

    const undertrainedThisWeek = imbalanceThisWeek
        .filter((x) => x.diffPercent < -0.05)
        .sort((a, b) => a.diffPercent - b.diffPercent)

    const thisWeekTip = getThisWeekTip(undertrainedThisWeek)

    // hide thisWeekTip for FIRST workout of the week
    const totalThisWeek = Object.values(currentWeekLoads).reduce(
        (sum, sec) => sum + (sec.currentWeekAvg || 0),
        0,
    )

    const hideThisWeekTip = totalThisWeek === todayLoad

    // -----------------------------------------------------------
    // WORKOUT CRUD
    // -----------------------------------------------------------
    async function handleAddEntries(entries) {
        const editing = entries.find((e) => e._editingId)

        if (editing) {
            const { data } = await updateWorkout(editing._editingId, {
                exercise_id: editing.exerciseId,
                reps: Number(editing.reps),
                weight: Number(editing.weight),
            })

            if (data) {
                setWorkouts((prev) =>
                    prev.map((w) =>
                        w.id === editing._editingId ? data[0] : w,
                    ),
                )
            }

            // Keep exercise + weight, clear reps, remove edit mode
            setFormEntries([
                {
                    exerciseId: editing.exerciseId,
                    weight: editing.weight,
                    reps: '',
                },
            ])
            setFormSearchTerms([editing.exerciseName]) // if you store name
            setFormDropdownOpen([false])

            return
        }

        const payload = entries.map((e) => ({
            user_id: USER_ID,
            exercise_id: e.exerciseId,
            reps: Number(e.reps),
            weight: Number(e.weight),
        }))

        const { data } = await insertWorkouts(payload)
        if (data) setWorkouts((prev) => [...data, ...prev])
    }

    async function handleDelete(id) {
        await deleteWorkout(id)
        setWorkouts(workouts.filter((w) => w.id !== id))
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

    // -----------------------------------------------------------
    // RENDER
    // -----------------------------------------------------------
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
                        {showWorkoutTip && (
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

                        {!hideThisWeekTip && showThisWeekTip && (
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

                {tab === 'history' && <WorkoutList workouts={workouts} />}

                {tab === 'summary' && <WorkoutSummary workouts={workouts} />}

                {tab === 'preferences' && (
                    <Preferences
                        hiddenExercises={hiddenExercises}
                        setHiddenExercises={setHiddenExercises}
                    />
                )}

                {tab === 'targets' && (
                    <TargetsForm
                        muscleTargets={muscleTargets}
                        currentProportions={currentProportions}
                        targetProportions={targetProportions}
                        onSave={(updated) =>
                            saveMuscleTargets(USER_ID, updated).then(() =>
                                setMuscleTargets(updated),
                            )
                        }
                    />
                )}

                {tab === 'add-exercise' && <AddExerciseForm />}
            </div>
        </div>
    )
}
