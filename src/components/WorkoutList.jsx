import { useState } from 'react'
import { WorkoutWeek, WorkoutDay } from '../models/workoutModels'
import './WorkoutList.css'

export function groupWorkouts(workouts) {
    const grouped = {}
    workouts.forEach((w) => {
        const date = w.ymd || new Date(w.created_at).toISOString().slice(0, 10)
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown Exercise'

        if (!grouped[date]) grouped[date] = {}
        if (!grouped[date][type]) grouped[date][type] = {}
        if (!grouped[date][type][name]) grouped[date][type][name] = []

        grouped[date][type][name].push(w)
    })
    return grouped
}

function computePRStats(workouts, exerciseId, todaySets) {
    if (!exerciseId) {
        return {
            setPR: 0,
            exercisePR: 0,
            todayLoad: 0,
            progress: 0,
            remaining: 0,
        }
    }

    const all = workouts.filter((w) => w.exercise_id === exerciseId)

    // --- Set PR = highest weight ever ---
    const setPR = all.length ? Math.max(...all.map((w) => w.weight || 0)) : 0

    // --- Exercise PR = best daily total load ---
    const dailyTotals = {}
    all.forEach((w) => {
        const ymd = w.ymd || new Date(w.created_at).toISOString().slice(0, 10)
        const load = (w.weight || 0) * (w.reps || 0)
        dailyTotals[ymd] = (dailyTotals[ymd] || 0) + load
    })

    const exercisePR = Object.keys(dailyTotals).length
        ? Math.max(...Object.values(dailyTotals))
        : 0

    // --- Today load ---
    const todayLoad = todaySets.reduce(
        (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
        0,
    )

    const progress =
        exercisePR > 0 ? Math.min(100, (todayLoad / exercisePR) * 100) : 0

    const remaining = exercisePR - todayLoad

    return { setPR, exercisePR, todayLoad, progress, remaining }
}
export default function WorkoutList({
    workouts,
    onDelete,
    onEdit,
    prevStats, // kept as per Option B but unused
    hideDate = false,
}) {
    const [collapsedDates, setCollapsedDates] = useState({})
    const [collapsedTypes, setCollapsedTypes] = useState({})
    const [collapsedExercises, setCollapsedExercises] = useState({})
    const [openPR, setOpenPR] = useState({})
    const toggleDate = (date) =>
        setCollapsedDates((p) => ({ ...p, [date]: !p[date] }))
    const toggleType = (date, type) => {
        const key = `${date}-${type}`
        setCollapsedTypes((p) => ({ ...p, [key]: !p[key] }))
    }
    const toggleExercise = (date, type, name) => {
        const key = `${date}-${type}-${name}`
        setCollapsedExercises((p) => ({ ...p, [key]: !p[key] }))
    }

    if (!workouts?.length)
        return <p className="no-workouts">No workouts yet.</p>

    const todayYMD = new Date().toISOString().slice(0, 10)
    const displayWorkouts = hideDate
        ? workouts.filter(
              (w) =>
                  (w.ymd ||
                      new Date(w.created_at).toISOString().slice(0, 10)) ===
                  todayYMD,
          )
        : workouts

    const grouped = groupWorkouts(displayWorkouts)

    return (
        <div className="workout-list-container">
            {Object.entries(grouped).map(([date, types]) => {
                const showDate = !hideDate
                return (
                    <div key={date} className="workout-date-card">
                        {showDate && (
                            <div
                                className="date-header"
                                onClick={() => toggleDate(date)}
                            >
                                {date} {collapsedDates[date] ? '+' : '-'}
                            </div>
                        )}

                        {!collapsedDates[date] &&
                            Object.entries(types).map(([type, exercises]) => {
                                const typeKey = `${date}-${type}`
                                return (
                                    <div key={typeKey} className="type-card">
                                        <div
                                            className="type-header"
                                            onClick={() =>
                                                toggleType(date, type)
                                            }
                                        >
                                            {type}{' '}
                                            {collapsedTypes[typeKey]
                                                ? '+'
                                                : '-'}
                                        </div>

                                        {!collapsedTypes[typeKey] &&
                                            Object.entries(exercises).map(
                                                ([name, sets]) => {
                                                    const exKey = `${date}-${type}-${name}`

                                                    const totalWeight =
                                                        sets.reduce(
                                                            (s, x) =>
                                                                s +
                                                                (x.weight ||
                                                                    0) *
                                                                    (x.reps ||
                                                                        0),
                                                            0,
                                                        )
                                                    const totalReps =
                                                        sets.reduce(
                                                            (s, x) =>
                                                                s +
                                                                (x.reps || 0),
                                                            0,
                                                        )
                                                    const bestSet = sets.reduce(
                                                        (m, x) =>
                                                            Math.max(
                                                                m,
                                                                (x.weight ||
                                                                    0) *
                                                                    (x.reps ||
                                                                        0),
                                                            ),
                                                        0,
                                                    )

                                                    const exerciseId =
                                                        sets[0]?.exercise_id

                                                    const {
                                                        setPR,
                                                        exercisePR,
                                                        todayLoad,
                                                        progress,
                                                        remaining,
                                                    } = computePRStats(
                                                        workouts,
                                                        exerciseId,
                                                        sets,
                                                    )

                                                    return (
                                                        <div
                                                            key={exKey}
                                                            className="exercise-card"
                                                        >
                                                            <div
                                                                className="exercise-header"
                                                                onClick={() =>
                                                                    toggleExercise(
                                                                        date,
                                                                        type,
                                                                        name,
                                                                    )
                                                                }
                                                            >
                                                                {name}{' '}
                                                                {collapsedExercises[
                                                                    exKey
                                                                ]
                                                                    ? '+'
                                                                    : '-'}
                                                            </div>

                                                            {!collapsedExercises[
                                                                exKey
                                                            ] && (
                                                                <>
                                                                    {sets.map(
                                                                        (s) => (
                                                                            <div
                                                                                key={
                                                                                    s.id
                                                                                }
                                                                                className="workout-item-card"
                                                                            >
                                                                                <span>
                                                                                    {
                                                                                        s.reps
                                                                                    }{' '}
                                                                                    reps
                                                                                    @{' '}
                                                                                    {
                                                                                        s.weight
                                                                                    }{' '}
                                                                                    kg
                                                                                </span>

                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            onEdit(
                                                                                                s,
                                                                                            )
                                                                                        }
                                                                                        className="edit-button"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            onDelete(
                                                                                                s.id,
                                                                                            )
                                                                                        }
                                                                                        className="delete-button"
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                    {/* Toggle PR Section */}
                                                                    <button
                                                                        className="pr-toggle-button"
                                                                        onClick={() =>
                                                                            setOpenPR(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [exKey]:
                                                                                        !prev[
                                                                                            exKey
                                                                                        ],
                                                                                }),
                                                                            )
                                                                        }
                                                                    >
                                                                        {openPR[
                                                                            exKey
                                                                        ]
                                                                            ? 'Hide Stats'
                                                                            : 'Show Stats'}
                                                                    </button>
                                                                    {hideDate &&
                                                                        openPR[
                                                                            exKey
                                                                        ] && (
                                                                            <div className="pr-box">
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Exercise
                                                                                        PR:
                                                                                    </strong>{' '}
                                                                                    {exercisePR.toLocaleString()}{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Set
                                                                                        PR:
                                                                                    </strong>{' '}
                                                                                    {setPR.toLocaleString()}{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Today
                                                                                        Load:
                                                                                    </strong>{' '}
                                                                                    {todayLoad.toLocaleString()}{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div
                                                                                    className={`stats-block ${
                                                                                        progress >
                                                                                        100
                                                                                            ? 'progress-new-pr'
                                                                                            : progress >=
                                                                                                90
                                                                                              ? 'progress-excellent'
                                                                                              : progress >=
                                                                                                  70
                                                                                                ? 'progress-good'
                                                                                                : ''
                                                                                    }`}
                                                                                >
                                                                                    <strong>
                                                                                        Progress:
                                                                                    </strong>{' '}
                                                                                    {progress.toFixed(
                                                                                        1,
                                                                                    )}
                                                                                    %
                                                                                </div>
                                                                                <div
                                                                                    className={`stats-block ${
                                                                                        remaining <=
                                                                                        0
                                                                                            ? 'remaining-hit-pr'
                                                                                            : remaining <=
                                                                                                exercisePR *
                                                                                                    0.2
                                                                                              ? 'remaining-close'
                                                                                              : ''
                                                                                    }`}
                                                                                >
                                                                                    <strong>
                                                                                        To
                                                                                        PR:
                                                                                    </strong>{' '}
                                                                                    {remaining.toLocaleString()}{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Total
                                                                                        Reps:
                                                                                    </strong>{' '}
                                                                                    {
                                                                                        totalReps
                                                                                    }
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Best
                                                                                        Set:
                                                                                    </strong>{' '}
                                                                                    {
                                                                                        bestSet
                                                                                    }{' '}
                                                                                    kg·rep
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                },
                                            )}
                                    </div>
                                )
                            })}
                    </div>
                )
            })}
        </div>
    )
}
