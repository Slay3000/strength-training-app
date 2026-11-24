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
} from './utils/workoutStats'
import {
    computeTodayLoad,
    computeCurrentProportions,
    computeTargetProportions,
} from './utils/muscleStats'
import { computeTrainingTips } from './utils/tips'

// components
import TopMenu from './components/TopMenu'
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import WorkoutSummary from './components/WorkoutSummary'
import Preferences from './components/Preferences'
import AddExerciseForm from './components/AddExerciseForm'
import TargetsForm from './components/TargetsForm'
import LoginForm from './components/LoginForm'
import SuggestionsPage from './components/Suggestions'

import './App.css'

export default function App() {
    const { userId: USER_ID, loading } = useAuth()

    const [workouts, setWorkouts] = useState([])
    const [muscleTargets, setMuscleTargets] = useState({})
    const [dataLoading, setDataLoading] = useState(true)
    const [hiddenExercises, setHiddenExercises] = useState([])
    const [bodyweight, setBodyweight] = useState(
        () => Number(localStorage.getItem('bodyweight_kg')) || null,
    )

    const [tab, setTab] = useState('current')

    // Workout form persistent state
    const [formEntries, setFormEntries] = useState([
        { exerciseId: '', reps: '', weight: '' },
    ])
    const [formSearchTerms, setFormSearchTerms] = useState([''])
    const [formDropdownOpen, setFormDropdownOpen] = useState([false])

    const [showWorkoutTip, setShowWorkoutTip] = useState(true)
    const [showThisWeekTip, setShowThisWeekTip] = useState(true)

    // Sync bodyweight when Preferences updates localStorage (same-tab writes)
    useEffect(() => {
        function handleStorage() {
            const val = Number(localStorage.getItem('bodyweight_kg')) || null
            setBodyweight(val)
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    // -----------------------------------------------------------
    // LOAD WORKOUTS + MUSCLE TARGETS
    // -----------------------------------------------------------
    useEffect(() => {
        if (!USER_ID) {
            setDataLoading(false)
            return
        }

        let isMounted = true

        async function loadData() {
            setDataLoading(true)
            try {
                // Workouts
                const { data: workoutsData } = await fetchWorkouts(USER_ID)
                if (isMounted) {
                    setWorkouts(workoutsData || [])
                }

                // Targets
                const { data: targets } = await fetchMuscleTargets(USER_ID)
                if (isMounted) {
                    if (targets?.length > 0) {
                        setMuscleTargets(
                            Object.fromEntries(
                                targets.map((t) => [t.muscle, t.ratio]),
                            ),
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
            } finally {
                if (isMounted) {
                    setDataLoading(false)
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [USER_ID])

    // -----------------------------------------------------------
    // AUTH + LOGIN SCREENS
    // -----------------------------------------------------------
    if (loading || (USER_ID && dataLoading)) return <p>Loading...</p>
    if (!USER_ID) {
        return <LoginForm />
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

    const { workoutTip, thisWeekTip, hideThisWeekTip } = computeTrainingTips({
        weeklyAverages,
        targetProportions,
        currentProportions,
        todayLoad,
    })

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
            <TopMenu tab={tab} setTab={setTab} />

            <div className="tab-content">
                {tab === 'current' && (
                    <>
                        {workouts.length > 0 && showWorkoutTip && (
                            <div className="workout-tip closable">
                                <span>{workoutTip}</span>
                                <button
                                    type="button"
                                    className="tip-close-button"
                                    onClick={() => setShowWorkoutTip(false)}
                                    aria-label="Dismiss tip"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {workouts.length > 0 &&
                            !hideThisWeekTip &&
                            showThisWeekTip && (
                                <div className="workout-tip secondary-tip closable">
                                    <span>{thisWeekTip}</span>
                                    <button
                                        type="button"
                                        className="tip-close-button"
                                        onClick={() =>
                                            setShowThisWeekTip(false)
                                        }
                                        aria-label="Dismiss tip"
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
                            bodyweight={bodyweight}
                        />
                    </>
                )}

                {tab === 'history' && <WorkoutList workouts={workouts} bodyweight={bodyweight} />}

                {tab === 'summary' && <WorkoutSummary workouts={workouts} />}

                {tab === 'preferences' && (
                    <Preferences
                        hiddenExercises={hiddenExercises}
                        setHiddenExercises={setHiddenExercises}
                        onBodyweightChange={(val) => setBodyweight(val ? Number(val) : null)}
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

                {(tab === 'suggestions' || tab === 'suggest') && (
                    <SuggestionsPage
                        workouts={workouts}
                        onSelectExercise={(exerciseName) => {
                            setFormSearchTerms([exerciseName])
                            setTab('current')
                        }}
                    />
                )}
            </div>
        </div>
    )
}
