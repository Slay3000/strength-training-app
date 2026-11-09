import { useState } from 'react'
import TodaySummaryBar from './TodaySummaryBar'
import ExerciseCard from './ExerciseCard'
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

    // Sort sets descending (newest set first at top of list)
    Object.values(grouped).forEach((types) => {
        Object.values(types).forEach((exercises) => {
            Object.values(exercises).forEach((sets) => {
                sets.sort((a, b) => {
                    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
                    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
                    if (timeA !== timeB) return timeB - timeA
                    return (b.id || 0) - (a.id || 0)
                })
            })
        })
    })

    return grouped
}

export default function WorkoutList({
    workouts,
    onDelete,
    onEdit,
    hideDate = false,
    toGoToday,
    todayLoad,
    prevWeekAvg,
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
                  (w.ymd || new Date(w.created_at).toISOString().slice(0, 10)) ===
                  todayYMD,
          )
        : workouts

    const grouped = groupWorkouts(displayWorkouts)

    return (
        <div className="workout-list-container">
            {hideDate && (
                <TodaySummaryBar
                    todayLoad={todayLoad}
                    prevWeekAvg={prevWeekAvg}
                    toGoToday={toGoToday}
                />
            )}

            {Object.entries(grouped).map(([date, types]) => (
                <div key={date} className="workout-date-card">
                    {!hideDate && (
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
                                        onClick={() => toggleType(date, type)}
                                    >
                                        {type}{' '}
                                        {collapsedTypes[typeKey] ? '+' : '-'}
                                    </div>

                                    {!collapsedTypes[typeKey] &&
                                        Object.entries(exercises).map(
                                            ([name, sets]) => {
                                                const exKey = `${date}-${type}-${name}`
                                                return (
                                                    <ExerciseCard
                                                        key={exKey}
                                                        name={name}
                                                        sets={sets}
                                                        exKey={exKey}
                                                        workouts={workouts}
                                                        hideDate={hideDate}
                                                        onEdit={onEdit}
                                                        onDelete={onDelete}
                                                        openPR={openPR}
                                                        setOpenPR={setOpenPR}
                                                        collapsed={
                                                            collapsedExercises[exKey]
                                                        }
                                                        onToggle={() =>
                                                            toggleExercise(
                                                                date,
                                                                type,
                                                                name,
                                                            )
                                                        }
                                                    />
                                                )
                                            },
                                        )}
                                </div>
                            )
                        })}
                </div>
            ))}
        </div>
    )
}
