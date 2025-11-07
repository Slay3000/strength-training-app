import { useState } from 'react'
import { WorkoutWeek, WorkoutDay, SectionModel } from '../models/workoutModels'

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

export default function WorkoutList({
    workouts,
    onDelete,
    onEdit,
    hideDate = false,
}) {
    const [collapsedDates, setCollapsedDates] = useState({})
    const [collapsedTypes, setCollapsedTypes] = useState({})
    const [collapsedExercises, setCollapsedExercises] = useState({})

    const toggleDate = (date) =>
        setCollapsedDates({ ...collapsedDates, [date]: !collapsedDates[date] })
    const toggleType = (date, type) => {
        const key = `${date}-${type}`
        setCollapsedTypes({ ...collapsedTypes, [key]: !collapsedTypes[key] })
    }
    const toggleExercise = (date, type, name) => {
        const key = `${date}-${type}-${name}`
        setCollapsedExercises({
            ...collapsedExercises,
            [key]: !collapsedExercises[key],
        })
    }

    if (!workouts || workouts.length === 0)
        return <p className="no-workouts">No workouts yet.</p>

    const grouped = groupWorkouts(workouts)

    // --- Weekly comparison using WorkoutWeek model ---
    function createWorkoutDays(workouts) {
        const groupedByDate = workouts.reduce((acc, w) => {
            const date =
                w.ymd || new Date(w.created_at).toISOString().slice(0, 10)
            if (!acc[date]) acc[date] = []
            acc[date].push(w)
            return acc
        }, {})

        return Object.entries(groupedByDate).map(
            ([date, ws]) => new WorkoutDay(date, ws)
        )
    }

    // --- Compute current and previous week ---
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    const oneWeekAgo = new Date(monday)
    oneWeekAgo.setDate(monday.getDate() - 7)
    oneWeekAgo.setHours(0, 0, 0, 0)

    // 1️⃣ Create all WorkoutDay instances
    const allWorkoutDays = createWorkoutDays(workouts)

    // 2️⃣ Filter by week
    const thisWeekWorkoutDays = allWorkoutDays.filter(
        (wd) => new Date(wd.date) >= monday
    )
    const lastWeekWorkoutDays = allWorkoutDays.filter(
        (wd) => new Date(wd.date) >= oneWeekAgo && new Date(wd.date) < monday
    )

    // 3️⃣ Create WorkoutWeek instances using the filtered workouts
    const currentWeek = new WorkoutWeek(
        monday,
        thisWeekWorkoutDays.flatMap((wd) => wd.workouts)
    )
    const previousWeek = new WorkoutWeek(
        oneWeekAgo,
        lastWeekWorkoutDays.flatMap((wd) => wd.workouts)
    )

    // 4️⃣ Compare weeks
    const weekComparison = currentWeek.compareTo(previousWeek)

    const overall = weekComparison.overall || {}

    return (
        <div className="workout-list-container">
            {/* Overall Weekly Load */}
            {hideDate && (
                <div className="overall-weekly-stats stats-row">
                    <div className="stats-block">
                        <strong>Total Weekly Load</strong>
                        {(overall.totalLoad || 0).toLocaleString()} kg
                    </div>
                    <div
                        className={`stats-block ${
                            overall.diff > 0
                                ? 'red-positive'
                                : overall.diff < 0
                                ? 'green-negative'
                                : 'neutral'
                        }`}
                    >
                        <strong>Δ vs Last Week</strong>
                        {(overall.diff > 0
                            ? `+${overall.diff}`
                            : overall.diff || 0
                        ).toLocaleString()}{' '}
                        kg
                    </div>
                </div>
            )}

            {/* Grouped by Date */}
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
                                const sectionComparison = weekComparison[
                                    type
                                ] || {
                                    previousLoad: 0,
                                    currentLoad: 0,
                                    loadToGo: 0,
                                    avgWeeklyLoad: 0,
                                    toGoVsLastWeek: 0,
                                }

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
                                            hideDate && (
                                                <div className="type-stats stats-row">
                                                    <div className="stats-block">
                                                        <strong>
                                                            Previous Total
                                                        </strong>{' '}
                                                        {sectionComparison.previousLoad?.toLocaleString() ||
                                                            0}{' '}
                                                        kg
                                                    </div>
                                                    <div
                                                        className={`stats-block ${
                                                            sectionComparison.toGoVsLastWeek >
                                                            0
                                                                ? 'red-positive'
                                                                : sectionComparison.toGoVsLastWeek <
                                                                  0
                                                                ? 'green-negative'
                                                                : 'neutral'
                                                        }`}
                                                    >
                                                        <strong>
                                                            Δ vs Last Week
                                                        </strong>{' '}
                                                        {(sectionComparison.toGoVsLastWeek >
                                                        0
                                                            ? `+${sectionComparison.toGoVsLastWeek}`
                                                            : sectionComparison.toGoVsLastWeek ||
                                                              0
                                                        ).toLocaleString()}{' '}
                                                        kg
                                                    </div>
                                                    <div className="stats-block">
                                                        <strong>
                                                            Weekly Avg Load
                                                        </strong>{' '}
                                                        {sectionComparison.avgWeeklyLoad?.toLocaleString() ||
                                                            0}{' '}
                                                        kg/day
                                                    </div>
                                                </div>
                                            )}

                                        {/* Exercises */}
                                        {!collapsedTypes[typeKey] &&
                                            Object.entries(exercises).map(
                                                ([name, sets]) => {
                                                    const exKey = `${date}-${type}-${name}`
                                                    const totalWeight =
                                                        sets.reduce(
                                                            (sum, s) =>
                                                                sum +
                                                                (s.reps || 0) *
                                                                    (s.weight ||
                                                                        0),
                                                            0
                                                        )
                                                    const totalReps =
                                                        sets.reduce(
                                                            (sum, s) =>
                                                                sum +
                                                                (s.reps || 0),
                                                            0
                                                        )
                                                    const bestSet = sets.reduce(
                                                        (max, s) =>
                                                            Math.max(
                                                                max,
                                                                (s.reps || 0) *
                                                                    (s.weight ||
                                                                        0)
                                                            ),
                                                        0
                                                    )
                                                    const lastMax = Math.max(
                                                        ...sets.map(
                                                            (s) => s.weight || 0
                                                        )
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
                                                                        name
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
                                                                                                s
                                                                                            )
                                                                                        }
                                                                                        className="edit-button"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            onDelete(
                                                                                                s.id
                                                                                            )
                                                                                        }
                                                                                        className="delete-button"
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}

                                                                    <div className="exercise-stats stats-row">
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Total
                                                                                Weight
                                                                            </strong>{' '}
                                                                            {totalWeight?.toLocaleString() ||
                                                                                0}{' '}
                                                                            kg
                                                                        </div>
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Total
                                                                                Reps
                                                                            </strong>{' '}
                                                                            {totalReps ||
                                                                                0}
                                                                        </div>
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Best
                                                                                Set
                                                                            </strong>{' '}
                                                                            {bestSet ||
                                                                                0}{' '}
                                                                            kg·rep
                                                                        </div>
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Last
                                                                                Max
                                                                            </strong>{' '}
                                                                            {lastMax ||
                                                                                0}{' '}
                                                                            kg
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                }
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
