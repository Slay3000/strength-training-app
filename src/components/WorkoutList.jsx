import { useState } from 'react'
import { groupWorkouts } from '../helpers/workout'

export default function WorkoutList({
    workouts,
    onDelete,
    onEdit,
    hideDate = false,
    prevStats = { sections: {}, exercises: {} },
    weeklyAverages,
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
                        {weeklyAverages?.overall && hideDate && (
                            <div className="overall-weekly-stats stats-row">
                                <div className="stats-block">
                                    <strong>Overall Weekly Avg</strong>
                                    {weeklyAverages.overall.currentWeekAvg} kg
                                </div>
                                <div
                                    className={`stats-block ${
                                        weeklyAverages.overall.loadToGo > 0
                                            ? 'red-positive'
                                            : weeklyAverages.overall.loadToGo <
                                              0
                                            ? 'green-negative'
                                            : 'neutral'
                                    }`}
                                >
                                    <strong>To Go (vs last week)</strong>
                                    {weeklyAverages.overall.loadToGo > 0
                                        ? `+${weeklyAverages.overall.loadToGo}`
                                        : weeklyAverages.overall.loadToGo}{' '}
                                    kg
                                </div>
                            </div>
                        )}

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
                                const sectionPrev =
                                    prevStats.sections[type]?.prevTotalWeight ||
                                    0
                                const sectionLoadToGo =
                                    prevStats.sections[type]?.loadToGo || 0

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
                                                            Previous Load
                                                        </strong>
                                                        {sectionPrev} kg
                                                    </div>
                                                    <div
                                                        className={`stats-block ${
                                                            sectionLoadToGo > 0
                                                                ? 'red-positive'
                                                                : sectionLoadToGo <
                                                                  0
                                                                ? 'green-negative'
                                                                : 'neutral'
                                                        }`}
                                                    >
                                                        <strong>
                                                            Load To Go
                                                        </strong>
                                                        {sectionLoadToGo > 0
                                                            ? `+${sectionLoadToGo}`
                                                            : sectionLoadToGo}{' '}
                                                        kg
                                                    </div>

                                                    {weeklyAverages?.sections?.[
                                                        type
                                                    ] && (
                                                        <>
                                                            <div className="stats-block">
                                                                <strong>
                                                                    Avg Weekly
                                                                    Load
                                                                </strong>
                                                                {
                                                                    weeklyAverages
                                                                        .sections[
                                                                        type
                                                                    ]
                                                                        .currentWeekAvg
                                                                }{' '}
                                                                kg
                                                            </div>
                                                            <div
                                                                className={`stats-block ${
                                                                    weeklyAverages
                                                                        .sections[
                                                                        type
                                                                    ].loadToGo >
                                                                    0
                                                                        ? 'red-positive'
                                                                        : weeklyAverages
                                                                              .sections[
                                                                              type
                                                                          ]
                                                                              .loadToGo <
                                                                          0
                                                                        ? 'green-negative'
                                                                        : 'neutral'
                                                                }`}
                                                            >
                                                                <strong>
                                                                    To Go (vs
                                                                    last week)
                                                                </strong>
                                                                {weeklyAverages
                                                                    .sections[
                                                                    type
                                                                ].loadToGo > 0
                                                                    ? `+${weeklyAverages.sections[type].loadToGo}`
                                                                    : weeklyAverages
                                                                          .sections[
                                                                          type
                                                                      ]
                                                                          .loadToGo}{' '}
                                                                kg
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                        {!collapsedTypes[typeKey] &&
                                            Object.entries(exercises).map(
                                                ([name, sets]) => {
                                                    const exKey = `${date}-${type}-${name}`
                                                    const exercisePrev =
                                                        prevStats.exercises[
                                                            name
                                                        ]?.prevTotalWeight || 0
                                                    const exerciseLoadToGo =
                                                        prevStats.exercises[
                                                            name
                                                        ]?.loadToGo || 0
                                                    const lastMaxWeight =
                                                        prevStats.exercises[
                                                            name
                                                        ]?.lastMaxWeight || 0

                                                    const totalWeight =
                                                        sets.reduce(
                                                            (sum, s) =>
                                                                sum +
                                                                (s.weight ||
                                                                    0) *
                                                                    (s.reps ||
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
                                                                (s.weight ||
                                                                    0) *
                                                                    (s.reps ||
                                                                        0)
                                                            ),
                                                        0
                                                    )

                                                    // Adjust load-to-go sign
                                                    const displayLoadToGo =
                                                        exerciseLoadToGo -
                                                        totalWeight

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
                                                                ) && (
                                                                    <>
                                                                        {sets.map(
                                                                            (
                                                                                w
                                                                            ) => (
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

                                                                        {/* Exercise stats */}
                                                                        {hideDate && (
                                                                            <div className="exercise-stats stats-row">
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Previous
                                                                                        Load
                                                                                    </strong>
                                                                                    {
                                                                                        exercisePrev
                                                                                    }{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div
                                                                                    className={`stats-block ${
                                                                                        displayLoadToGo >
                                                                                        0
                                                                                            ? 'red-positive'
                                                                                            : displayLoadToGo <
                                                                                              0
                                                                                            ? 'green-negative'
                                                                                            : 'neutral'
                                                                                    }`}
                                                                                >
                                                                                    <strong>
                                                                                        Load
                                                                                        To
                                                                                        Go
                                                                                    </strong>
                                                                                    {displayLoadToGo >
                                                                                    0
                                                                                        ? `+${displayLoadToGo}`
                                                                                        : displayLoadToGo}{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Last
                                                                                        Max
                                                                                        Weight
                                                                                    </strong>
                                                                                    {
                                                                                        lastMaxWeight
                                                                                    }{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Total
                                                                                        Weight
                                                                                    </strong>
                                                                                    {
                                                                                        totalWeight
                                                                                    }{' '}
                                                                                    kg
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Total
                                                                                        Reps
                                                                                    </strong>
                                                                                    {
                                                                                        totalReps
                                                                                    }
                                                                                </div>
                                                                                <div className="stats-block">
                                                                                    <strong>
                                                                                        Best
                                                                                        Set
                                                                                    </strong>
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
