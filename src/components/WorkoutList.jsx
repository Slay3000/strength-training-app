import { useState } from 'react'
import { WorkoutWeek, WorkoutDay } from '../models/workoutModels'

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
    workouts, // all workouts passed in (used for historical lookups)
    onDelete,
    onEdit,
    hideDate = false,
}) {
    const [collapsedDates, setCollapsedDates] = useState({})
    const [collapsedTypes, setCollapsedTypes] = useState({})
    const [collapsedExercises, setCollapsedExercises] = useState({})

    // ---------- Collapsing ----------
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

    if (!workouts || workouts.length === 0)
        return <p className="no-workouts">No workouts yet.</p>

    // ---------- Filter for display (Current tab shows only today) ----------
    const todayYMD = new Date().toISOString().slice(0, 10)
    const displayWorkouts = hideDate
        ? workouts.filter(
              (w) =>
                  (w.ymd ||
                      new Date(w.created_at).toISOString().slice(0, 10)) ===
                  todayYMD
          )
        : workouts

    // ---------- Grouped display ----------
    const grouped = groupWorkouts(displayWorkouts)

    // ---------- Helper: create WorkoutDay instances from any list ----------
    function createWorkoutDays(all) {
        const groupedByDate = all.reduce((acc, w) => {
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

    // ---------- Week bounds (Monday start) ----------
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    const oneWeekAgo = new Date(monday)
    oneWeekAgo.setDate(monday.getDate() - 7)
    oneWeekAgo.setHours(0, 0, 0, 0)

    // ---------- Build week models from whole history (workouts prop) ----------
    const allWorkoutDays = createWorkoutDays(workouts)
    const thisWeekWorkoutDays = allWorkoutDays.filter(
        (wd) => new Date(wd.date) >= monday
    )
    const lastWeekWorkoutDays = allWorkoutDays.filter(
        (wd) => new Date(wd.date) >= oneWeekAgo && new Date(wd.date) < monday
    )

    const currentWeek = new WorkoutWeek(
        monday,
        thisWeekWorkoutDays.flatMap((wd) => wd.workouts)
    )
    const previousWeek = new WorkoutWeek(
        oneWeekAgo,
        lastWeekWorkoutDays.flatMap((wd) => wd.workouts)
    )

    const weekComparison = currentWeek.compareTo(previousWeek)
    const overall = weekComparison.overall || {}

    // ---------- Helper: last max before a date for an exercise ----------
    // searches the full `workouts` array (historical) for entries with same exercise & section
    // and date strictly earlier than `dateYmd`, returns max weight (0 if none)
    function getLastMaxBefore(exerciseName, sectionName, dateYmd) {
        if (!exerciseName) return 0
        let max = 0
        for (const w of workouts) {
            const y = w.ymd || new Date(w.created_at).toISOString().slice(0, 10)
            if (y >= dateYmd) continue // only consider strictly earlier
            if (w.exercises?.name !== exerciseName) continue
            if (sectionName && w.exercises?.type !== sectionName) continue
            const wt = Number(w.weight) || 0
            if (wt > max) max = wt
        }
        return max
    }

    // ---------- RENDER ----------
    return (
        <div className="workout-list-container">
            {/* Weekly Summary */}
            {hideDate && (
                <div className="overall-weekly-stats stats-row">
                    <div className="stats-block">
                        <strong>Total Weekly Load</strong>{' '}
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
                        <strong>Δ vs Last Week</strong>{' '}
                        {(overall.diff > 0
                            ? `+${overall.diff}`
                            : overall.diff || 0
                        ).toLocaleString()}{' '}
                        kg
                    </div>
                </div>
            )}

            {/* Grouped by Date for displayWorkouts */}
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
                                                            (s, x) =>
                                                                s +
                                                                (x.weight ||
                                                                    0) *
                                                                    (x.reps ||
                                                                        0),
                                                            0
                                                        )
                                                    const totalReps =
                                                        sets.reduce(
                                                            (s, x) =>
                                                                s +
                                                                (x.reps || 0),
                                                            0
                                                        )
                                                    const bestSet = sets.reduce(
                                                        (m, x) =>
                                                            Math.max(
                                                                m,
                                                                (x.weight ||
                                                                    0) *
                                                                    (x.reps ||
                                                                        0)
                                                            ),
                                                        0
                                                    )

                                                    // --- lastMax: look into entire history before this date ---
                                                    const lastMax =
                                                        getLastMaxBefore(
                                                            name,
                                                            type,
                                                            date
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
                                                                            {totalWeight.toLocaleString()}{' '}
                                                                            kg
                                                                        </div>
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Total
                                                                                Reps
                                                                            </strong>{' '}
                                                                            {
                                                                                totalReps
                                                                            }
                                                                        </div>
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Best
                                                                                Set
                                                                            </strong>{' '}
                                                                            {
                                                                                bestSet
                                                                            }{' '}
                                                                            kg·rep
                                                                        </div>
                                                                        <div className="stats-block">
                                                                            <strong>
                                                                                Last
                                                                                Max
                                                                            </strong>{' '}
                                                                            {
                                                                                lastMax
                                                                            }{' '}
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
