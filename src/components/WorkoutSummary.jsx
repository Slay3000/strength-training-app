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
import { WorkoutDay, WorkoutWeek } from '../models/workoutModels'

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
    const thisWeekDays = allDays.filter(
        (d) => new Date(d.date) >= weekStartDate,
    )
    const lastWeekDays = allDays.filter(
        (d) =>
            new Date(d.date) >= prevWeekStartDate &&
            new Date(d.date) < weekStartDate,
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
    // ---------- Weekly comparison by section (bar chart) ----------
    const sectionLabels = Object.keys(weekComparison).filter(
        (k) => k !== 'overall',
    )
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
        ],
    }
    const sectionBarOptions = {
        responsive: true,
        plugins: {
            title: { display: true, text: 'Weekly Load by Section' },
            legend: { display: true },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg)' },
            },
            x: { title: { display: true, text: 'Section' } },
        },
    }

    // ---------- Weekly avg chart ----------
    const weeklyAvgBarData = {
        labels: ['Previous Week', 'Current Week'],
        datasets: [
            {
                label: 'Weekly Avg Load (kg/day)',
                data: [
                    previousWeek.avgLoadPerDay.toFixed(0),
                    currentWeek.avgLoadPerDay.toFixed(0),
                ],
                backgroundColor: [
                    'rgba(255,99,132,0.5)',
                    'rgba(75,192,192,0.6)',
                ],
            },
        ],
    }

    const barOptions = (title) => ({
        responsive: true,
        plugins: {
            legend: { display: true },
            title: { display: true, text: title },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg/day)' },
            },
            x: { title: { display: true, text: 'Section' } },
        },
    })

    // ---------- Render ----------
    return (
        <div className="summary-container">
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
                                        sectionStats.toGoVsLastWeek > 0
                                            ? 'positive'
                                            : sectionStats.toGoVsLastWeek < 0
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
                                                    const load =
                                                        (w.weight || 0) *
                                                        (w.reps || 0)
                                                    dailyMap[ymd] =
                                                        (dailyMap[ymd] || 0) +
                                                        load
                                                })

                                            const sortedDates =
                                                Object.keys(dailyMap).sort()
                                            const exerciseChartData = {
                                                labels: sortedDates,
                                                datasets: [
                                                    {
                                                        label: `${exName} Load Over Time`,
                                                        data: sortedDates.map(
                                                            (d) => dailyMap[d],
                                                        ),
                                                        borderColor: '#1f78b4',
                                                        backgroundColor:
                                                            'rgba(31, 120, 180, 0.2)',
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
                                                    <div
                                                        className="exercise-chart"
                                                        style={{
                                                            marginTop: 10,
                                                        }}
                                                    >
                                                        <Line
                                                            data={
                                                                exerciseChartData
                                                            }
                                                            options={barOptions(
                                                                `${exName} Load Over Time`,
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
