import { useState } from 'react'
import { groupWorkouts } from '../helpers/workout'

export default function WorkoutList({
    workouts,
    onDelete,
    onEdit,
    hideDate = false,
}) {
    const grouped = groupWorkouts(workouts)
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
                                                            ] &&
                                                                Array.isArray(
                                                                    sets
                                                                ) &&
                                                                sets.map(
                                                                    (w) => (
                                                                        <div
                                                                            key={
                                                                                w.id
                                                                            }
                                                                            className="workout-item-card"
                                                                        >
                                                                            <span>
                                                                                {
                                                                                    w.reps
                                                                                }{' '}
                                                                                reps
                                                                                @{' '}
                                                                                {
                                                                                    w.weight
                                                                                }{' '}
                                                                                kg
                                                                            </span>
                                                                            {hideDate && (
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            onEdit(
                                                                                                w
                                                                                            )
                                                                                        }
                                                                                        className="edit-button"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            onDelete(
                                                                                                w.id
                                                                                            )
                                                                                        }
                                                                                        className="delete-button"
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )
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
