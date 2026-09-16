import React, { useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import './WorkoutSummary.css'
import { WorkoutDay, WorkoutWeek } from '../../models/workoutModels'
import { computeRecoveryScores } from '../../helpers/recoveryScore'
import { calculate1RM } from '../../helpers/workout'
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
)

export default function WorkoutSummary({ workouts }) {
    const [openSections, setOpenSections] = useState({})
    const [exerciseMetrics, setExerciseMetrics] = useState({}) // exName -> 'load' | 'e1rm'

    const toggleSection = (key) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

    if (!workouts?.length) {
        return <div className="summary-container">No workouts yet.</div>
    }

    // ---------- Helpers ----------
    const toYMD = (d) => new Date(d).toISOString().slice(0, 10)

    const today = new Date()
    const dayOfWeek = today.getDay()
    const diffToMonday = (dayOfWeek + 6) % 7
    const weekStartDate = new Date(today)
    weekStartDate.setDate(today.getDate() - diffToMonday)
    weekStartDate.setHours(0, 0, 0, 0)

    const prevWeekStartDate = new Date(weekStartDate)
    prevWeekStartDate.setDate(weekStartDate.getDate() - 7)
    prevWeekStartDate.setHours(0, 0, 0, 0)

    // ---------- Create WorkoutDay instances ----------
    const createWorkoutDays = (workouts) => {
        const grouped = workouts.reduce((acc, w) => {
            const date = w.ymd || toYMD(w.created_at)
            if (!acc[date]) acc[date] = []
            acc[date].push(w)
            return acc
        }, {})

        return Object.entries(grouped).map(
            ([date, ws]) => new WorkoutDay(date, ws),
        )
    }

    const allDays = createWorkoutDays(workouts)
    const weekStartStr = toYMD(weekStartDate)
    const prevWeekStartStr = toYMD(prevWeekStartDate)

    const thisWeekDays = allDays.filter((d) => d.date >= weekStartStr)
    const lastWeekDays = allDays.filter(
        (d) => d.date >= prevWeekStartStr && d.date < weekStartStr,
    )

    const currentWeek = new WorkoutWeek(
        weekStartDate,
        thisWeekDays.flatMap((d) => d.workouts),
    )
    const previousWeek = new WorkoutWeek(
        prevWeekStartDate,
        lastWeekDays.flatMap((d) => d.workouts),
    )

    const weekComparison = currentWeek.compareTo(previousWeek)

    // Calculate best week data
    const allWeekStartDates = [
        ...new Set(
            workouts.map((w) => {
                const date = new Date(w.created_at)
                const dayOfWeek = date.getDay()
                const diffToMonday = (dayOfWeek + 6) % 7
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - diffToMonday)
                weekStart.setHours(0, 0, 0, 0)
                return weekStart.toISOString().slice(0, 10)
            }),
        ),
    ].sort()

    let bestOverallWeekLoad = 0
    const bestSectionLoads = {}
    const sectionLabels = Object.keys(weekComparison).filter(
        (k) => k !== 'overall',
    )
    for (const ws of allWeekStartDates) {
        const weekWorkouts = allDays.filter(
            (d) =>
                new Date(d.date) >= new Date(ws) &&
                new Date(d.date) <
                    new Date(new Date(ws).setDate(new Date(ws).getDate() + 7)),
        )
        const week = new WorkoutWeek(
            new Date(ws),
            weekWorkouts.flatMap((d) => d.workouts),
        )
        bestOverallWeekLoad = Math.max(bestOverallWeekLoad, week.avgLoadPerDay)
        for (const sectionName of sectionLabels) {
            bestSectionLoads[sectionName] = Math.max(
                bestSectionLoads[sectionName] || 0,
                week.getSection(sectionName).totalWeight,
            )
        }
    }

    const maxAvgLoad = Math.max(
        previousWeek.avgLoadPerDay,
        currentWeek.avgLoadPerDay,
        bestOverallWeekLoad,
    )
    const weeklyAvgSuggestedMax =
        maxAvgLoad > 0 ? Math.ceil(maxAvgLoad * 1.15) : undefined

    const recoveryStats = computeRecoveryScores(
        allDays,
        thisWeekDays,
        currentWeek,
        previousWeek,
        sectionLabels,
    )

    const maxPrevSectionLoad = Math.max(
        0,
        ...sectionLabels.map((t) => weekComparison[t]?.previousLoad || 0),
    )
    const maxCurrSectionLoad = Math.max(
        0,
        ...sectionLabels.map((t) => weekComparison[t]?.currentLoad || 0),
    )
    const maxBestSectionLoad = Math.max(
        0,
        ...sectionLabels.map((t) => bestSectionLoads[t] || 0),
    )
    const maxSectionVal = Math.max(
        maxPrevSectionLoad,
        maxCurrSectionLoad,
        maxBestSectionLoad,
    )
    const sectionSuggestedMax =
        maxSectionVal > 0 ? Math.ceil(maxSectionVal * 1.15) : undefined

    // ---------- Weekly comparison by section (bar chart) ----------

    const sectionComparisonBarData = {
        labels: sectionLabels,
        datasets: [
            {
                label: 'Previous Week',
                data: sectionLabels.map(
                    (t) => weekComparison[t]?.previousLoad || 0,
                ),
                backgroundColor: 'rgba(255,99,132,0.6)',
            },
            {
                label: 'Current Week',
                data: sectionLabels.map(
                    (t) => weekComparison[t]?.currentLoad || 0,
                ),
                backgroundColor: 'rgba(75,192,192,0.6)',
            },
            {
                label: 'Best Week',
                data: sectionLabels.map((t) => bestSectionLoads[t] || 0),
                backgroundColor: 'rgba(255,206,86,0.6)',
            },
        ],
    }
    const sectionBarOptions = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            title: {
                display: true,
                text: 'Weekly Load by Section',
                font: {
                    size: 14, // smaller for mobile
                },
            },
            legend: { display: true },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg)' },
                suggestedMax: sectionSuggestedMax,
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 5,
                    color: '#ccc',
                    font: {
                        size: 10,
                        family: 'Inter, sans-serif',
                    },
                },
            },
            x: {
                title: { display: true, text: 'Section' },
                ticks: {
                    color: '#ccc',
                    font: {
                        size: 10,
                        family: 'Inter, sans-serif',
                    },
                },
            },
        },
    }

    // ---------- Weekly avg chart ----------
    const weeklyAvgBarData = {
        labels: ['Previous Week', 'Current Week', 'Best Week'],
        datasets: [
            {
                label: 'Weekly Avg Load (kg/day)',
                data: [
                    previousWeek.avgLoadPerDay.toFixed(0),
                    currentWeek.avgLoadPerDay.toFixed(0),
                    bestOverallWeekLoad.toFixed(0),
                ],
                backgroundColor: [
                    'rgba(255,99,132,0.5)',
                    'rgba(75,192,192,0.6)',
                    'rgba(75,22,192,0.6)',
                ],
            },
        ],
    }

    const barOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: { display: true },
            title: { display: true, text: title },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg/day)' },
                suggestedMax: weeklyAvgSuggestedMax,
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 5,
                    color: '#ccc',
                    font: {
                        size: 10,
                        family: 'Inter, sans-serif',
                    },
                },
            },
            x: {
                title: { display: true, text: 'Period' },
                ticks: {
                    color: '#ccc',
                    font: {
                        size: 10,
                        family: 'Inter, sans-serif',
                    },
                },
            },
        },
    })

    const exerciseLineOptions = (title, dataValues = [], yTitle = 'Load (kg)') => {
        let suggestedMin
        let suggestedMax
        if (dataValues.length > 0) {
            const minVal = Math.min(...dataValues)
            const maxVal = Math.max(...dataValues)
            const diff = maxVal - minVal
            if (diff === 0) {
                suggestedMin = Math.max(0, minVal * 0.8 - 1)
                suggestedMax = maxVal * 1.2 + 1
            } else {
                suggestedMin = Math.max(0, Math.floor(minVal - diff * 0.15))
                suggestedMax = Math.ceil(maxVal + diff * 0.15)
            }
        }

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: title,
                    font: { size: 13 },
                },
            },
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin,
                    suggestedMax,
                    title: { display: true, text: 'Load (kg)' },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 5,
                        precision: 0,
                        color: '#ccc',
                        font: { size: 10, family: 'Inter, sans-serif' },
                    },
                },
                x: {
                    title: { display: true, text: 'Date' },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 6,
                        color: '#ccc',
                        font: { size: 10, family: 'Inter, sans-serif' },
                    },
                },
            },
        }
    }

    // ---------- Render ----------
    return (
        <div className="summary-container">
            {/* Recovery Score Section */}
            <div
                className="summary-section"
                style={{ borderLeft: `5px solid ${recoveryStats.color}` }}
            >
                {' '}
                {/* Use recoveryStats.overall.color */}
                {/* Overall Recovery Score - using recoveryStats.overall for consistency */}
                <h2 className="collapsible-header">🛌 Recovery Score</h2>
                <div className="stats-row">
                    <div className="stats-block">
                        <span
                            style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: recoveryStats.overall.color,
                            }}
                        >
                            {recoveryStats.overall.score}%
                        </span>
                    </div>
                    <div className="stats-block">
                        <strong>Status:</strong> {recoveryStats.overall.label}{' '}
                        {/* Use recoveryStats.overall.label */}
                        <p
                            style={{
                                fontSize: '0.8rem',
                                color: '#999',
                                margin: '4px 0 0',
                            }}
                        >
                            Based on weekly volume jumps and training frequency.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recovery Score by Section */}
            <div className="summary-section">
                <h2
                    className="collapsible-header"
                    onClick={() => toggleSection('recoveryBySection')}
                >
                    💪 Recovery Score by Section
                </h2>
                {openSections.recoveryBySection && (
                    <div className="exercise-breakdown">
                        {Object.entries(recoveryStats.sections).map(
                            ([sectionName, stats]) => (
                                <div
                                    key={sectionName}
                                    className="exercise-card"
                                >
                                    <strong>{sectionName}</strong>
                                    <div className="stats-row">
                                        <div className="stats-block">
                                            <span
                                                style={{
                                                    fontSize: '1.2rem',
                                                    fontWeight: 'bold',
                                                    color: stats.color, // Use stats.color
                                                }}
                                            >
                                                {stats.score}%
                                            </span>
                                        </div>
                                        <div className="stats-block">
                                            <strong>Status:</strong>{' '}
                                            {stats.label}{' '}
                                            {/* Use stats.label */}
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
            {/* Overall Summary */}
            <div className="summary-section">
                <h2
                    className="collapsible-header"
                    onClick={() => toggleSection('total')}
                >
                    🧮 Overall Summary ({toYMD(weekStartDate)} — {toYMD(today)})
                </h2>

                {openSections.total && (
                    <>
                        <div className="stats-row">
                            <div className="stats-block">
                                <strong>Total Weekly Load</strong>{' '}
                                {currentWeek.totalLoad.toLocaleString()} kg
                            </div>
                            <div className="stats-block">
                                <strong>Previous Week Total Load</strong>{' '}
                                {previousWeek.totalLoad.toLocaleString()} kg
                            </div>
                            <div
                                className={`stats-block ${
                                    weekComparison.overall.diff > 0
                                        ? 'red-positive'
                                        : weekComparison.overall.diff < 0
                                          ? 'green-negative'
                                          : 'neutral'
                                }`}
                            >
                                <strong>Δ vs Last Week</strong>{' '}
                                {weekComparison.overall.diff > 0
                                    ? `+${weekComparison.overall.diff}`
                                    : weekComparison.overall.diff}{' '}
                                kg
                            </div>
                            <div className="stats-block">
                                <strong>Best Week Total Load</strong>{' '}
                                {(bestOverallWeekLoad * 7).toLocaleString()} kg
                            </div>
                        </div>

                        <div
                            className="bar-chart-container"
                            style={{ marginTop: 20 }}
                        >
                            <Bar
                                data={weeklyAvgBarData}
                                options={{
                                    ...barOptions('Weekly Average Comparison'),
                                    plugins: { legend: { display: false } },
                                }}
                            />
                        </div>
                        <div
                            className="bar-chart-container"
                            style={{ marginTop: 30 }}
                        >
                            <Bar
                                data={sectionComparisonBarData}
                                options={sectionBarOptions}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Section Summaries */}
            {Object.entries(weekComparison)
                .filter(([k]) => k !== 'overall')
                .map(([sectionName, sectionStats]) => {
                    const key = `section-${sectionName}`
                    return (
                        <div key={key} className="summary-section">
                            <h3
                                className="collapsible-header"
                                onClick={() => toggleSection(key)}
                            >
                                {sectionName}{' '}
                                <span
                                    className={
                                        sectionStats.toGoVsLastWeek < 0
                                            ? 'positive'
                                            : sectionStats.toGoVsLastWeek > 0
                                              ? 'negative'
                                              : 'neutral'
                                    }
                                >
                                    (
                                    {sectionStats.toGoVsLastWeek > 0 ? '+' : ''}
                                    {sectionStats.toGoVsLastWeek} kg vs last
                                    week)
                                </span>
                            </h3>

                            {openSections[key] && (
                                <>
                                    <p>
                                        Previous Total:{' '}
                                        {sectionStats.previousLoad.toLocaleString()}{' '}
                                        kg
                                        <br />
                                        Current Total:{' '}
                                        {sectionStats.currentLoad.toLocaleString()}{' '}
                                        kg
                                        <br />
                                        Weekly Avg:{' '}
                                        {sectionStats.avgWeeklyLoad.toLocaleString()}{' '}
                                        kg/day
                                    </p>

                                    {/* Per-exercise breakdown with historical graph */}
                                    <div className="exercise-breakdown">
                                        {Object.entries(
                                            new WorkoutWeek(
                                                weekStartDate,
                                                workouts, // <-- use all historical workouts here
                                            ).getSection(sectionName)
                                                ?.exercises || {},
                                        ).map(([exName, exSets]) => {
                                            // Calculate stats for current week
                                            const totalWeight = exSets.reduce(
                                                (sum, s) =>
                                                    sum +
                                                    (s.weight || 0) *
                                                        (s.reps || 0),
                                                0,
                                            )
                                            const totalReps = exSets.reduce(
                                                (sum, s) => sum + (s.reps || 0),
                                                0,
                                            )
                                            const bestSet = exSets.reduce(
                                                (max, s) =>
                                                    Math.max(
                                                        max,
                                                        (s.weight || 0) *
                                                            (s.reps || 0),
                                                    ),
                                                0,
                                            )
                                            const lastMax = Math.max(
                                                ...exSets.map(
                                                    (s) => s.weight || 0,
                                                ),
                                            )
                                            // Historical stats for this exercise (similar to WorkoutForm)
                                            const allExerciseWorkouts =
                                                workouts.filter(
                                                    (w) =>
                                                        w.exercise_id ===
                                                        exSets[0]?.exercise_id,
                                                )

                                            let last = null
                                            let max = null
                                            let delta = null

                                            if (allExerciseWorkouts.length) {
                                                const sorted = [
                                                    ...allExerciseWorkouts,
                                                ].sort(
                                                    (a, b) =>
                                                        new Date(b.created_at) -
                                                        new Date(a.created_at),
                                                )
                                                last = sorted[0]

                                                max =
                                                    allExerciseWorkouts.reduce(
                                                        (m, w) => {
                                                            const load =
                                                                (w.weight ||
                                                                    0) *
                                                                (w.reps || 0)
                                                            const currentMax =
                                                                (m.weight ||
                                                                    0) *
                                                                (m.reps || 0)
                                                            return load >
                                                                currentMax
                                                                ? w
                                                                : m
                                                        },
                                                        sorted[0],
                                                    )

                                                delta =
                                                    sorted.length > 1
                                                        ? (last.weight || 0) *
                                                              (last.reps || 0) -
                                                          (sorted[1].weight ||
                                                              0) *
                                                              (sorted[1].reps ||
                                                                  0)
                                                        : null
                                            }

                                            // Historical data for graph (all workouts)
                                            const metric = exerciseMetrics[exName] || 'load'
                                            const dailyMap = {}
                                            workouts
                                                .filter(
                                                    (w) =>
                                                        w.exercises?.name ===
                                                            exName &&
                                                        w.exercises?.type ===
                                                            sectionName,
                                                )
                                                .forEach((w) => {
                                                    const ymd = toYMD(
                                                        w.created_at,
                                                    )
                                                    if (metric === 'e1rm') {
                                                        const e1rm = calculate1RM(w.weight, w.reps)
                                                        dailyMap[ymd] = Math.max(dailyMap[ymd] || 0, e1rm)
                                                    } else {
                                                        const load = (w.weight || 0) * (w.reps || 0)
                                                        dailyMap[ymd] = (dailyMap[ymd] || 0) + load
                                                    }
                                                })

                                            const sortedDates =
                                                Object.keys(dailyMap).sort()
                                            const exerciseChartData = {
                                                labels: sortedDates,
                                                datasets: [
                                                    {
                                                        label: metric === 'e1rm' ? `${exName} Est. 1RM Over Time` : `${exName} Load Over Time`,
                                                        borderColor: metric === 'e1rm' ? '#e31a1c' : '#1f78b4',
                                                        backgroundColor: metric === 'e1rm' ? 'rgba(227, 26, 28, 0.2)' : 'rgba(31, 120, 180, 0.2)',
                                                        data: sortedDates.map(
                                                            (d) => dailyMap[d],
                                                        ),
                                                                                                                fill: true,
                                                        tension: 0.3,
                                                    },
                                                ],
                                            }

                                            return (
                                                <div
                                                    key={exName}
                                                    className="exercise-card"
                                                >
                                                    <strong>{exName}</strong>
                                                    <div className="stats-row">
                                                        <div className="stats-block">
                                                            Total Weight:{' '}
                                                            {totalWeight.toLocaleString()}{' '}
                                                            kg
                                                        </div>
                                                        <div className="stats-block">
                                                            Total Reps:{' '}
                                                            {totalReps}
                                                        </div>
                                                        <div className="stats-block">
                                                            Best Set: {bestSet}{' '}
                                                            kg·rep
                                                        </div>
                                                        <div className="stats-block">
                                                            Last Max: {lastMax}{' '}
                                                            kg
                                                        </div>

                                                        {/* New stats */}
                                                        {last && (
                                                            <div className="stats-block">
                                                                Last:{' '}
                                                                {last.reps} ×{' '}
                                                                {last.weight} kg
                                                            </div>
                                                        )}
                                                        {delta !== null && (
                                                            <div
                                                                className={`stats-block ${delta >= 0 ? 'positive' : 'negative'}`}
                                                            >
                                                                Δ vs Previous:{' '}
                                                                {delta >= 0
                                                                    ? '+'
                                                                    : ''}
                                                                {delta} kg
                                                            </div>
                                                        )}
                                                        {max && (
                                                            <div className="stats-block">
                                                                Max: {max.reps}{' '}
                                                                × {max.weight}{' '}
                                                                kg
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Graph Metric:</span>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button
                                                                style={{
                                                                    padding: '2px 8px',
                                                                    fontSize: '0.75rem',
                                                                    borderRadius: 4,
                                                                    border: '1px solid #444',
                                                                    background: metric === 'load' ? '#1f78b4' : '#222',
                                                                    color: '#fff',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => setExerciseMetrics(prev => ({ ...prev, [exName]: 'load' }))}
                                                            >
                                                                Total Volume
                                                            </button>
                                                            <button
                                                                style={{
                                                                    padding: '2px 8px',
                                                                    fontSize: '0.75rem',
                                                                    borderRadius: 4,
                                                                    border: '1px solid #444',
                                                                    background: metric === 'e1rm' ? '#e31a1c' : '#222',
                                                                    color: '#fff',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => setExerciseMetrics(prev => ({ ...prev, [exName]: 'e1rm' }))}
                                                            >
                                                                Est. 1RM
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="exercise-chart"
                                                        style={{
                                                            marginTop: 6,
                                                        }}
                                                    >
                                                        <Line
                                                            data={
                                                                exerciseChartData
                                                            }
                                                            options={exerciseLineOptions(
                                                                metric === 'e1rm' ? `${exName} Est. 1RM Over Time` : `${exName} Load Over Time`,
                                                                sortedDates.map(
                                                                    (d) =>
                                                                        dailyMap[d],
                                                                ),
                                                                metric === 'e1rm' ? 'Est. 1RM (kg)' : 'Load (kg)'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
        </div>
    )
}
