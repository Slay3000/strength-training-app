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
import {
    calculateSectionStats,
    calculateWeeklyComparison,
} from '../helpers/workout'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
)

export default function WorkoutSummary({ workouts }) {
    const [openSections, setOpenSections] = useState({})

    const toggleSection = (key) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

    if (!workouts?.length) {
        return <div className="summary-container">No workouts yet.</div>
    }

    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekEnd = new Date(weekStart)
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)

    const weekWorkouts = workouts.filter(
        (w) => new Date(w.created_at) >= weekStart
    )
    const prevWeekWorkouts = workouts.filter(
        (w) =>
            new Date(w.created_at) >= prevWeekStart &&
            new Date(w.created_at) <= prevWeekEnd
    )

    const weekStats = calculateSectionStats(weekWorkouts)
    const prevWeekStats = calculateSectionStats(prevWeekWorkouts)
    const comparison = calculateWeeklyComparison(prevWeekWorkouts, weekWorkouts)

    const sections = Object.keys(weekStats)

    /** Helper to count workout days for averages */
    const getWorkoutDaysCount = (workouts, section = null) => {
        const days = new Set(
            workouts
                .filter((w) => (section ? w.exercises?.type === section : true))
                .map((w) => w.created_at.slice(0, 10))
        )
        return days.size || 1
    }

    /** 📊 Bar chart comparing current vs previous week per section */
    const createComparisonBarData = () => {
        const labels = Object.keys(weekStats)
        return {
            labels,
            datasets: [
                {
                    label: 'This Week (avg/day)',
                    data: labels.map((type) =>
                        Math.round(
                            (weekStats[type]?.totalWeight || 0) /
                                getWorkoutDaysCount(weekWorkouts, type)
                        )
                    ),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Last Week (avg/day)',
                    data: labels.map((type) =>
                        Math.round(
                            (prevWeekStats[type]?.totalWeight || 0) /
                                getWorkoutDaysCount(prevWeekWorkouts, type)
                        )
                    ),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
            ],
        }
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
                title: { display: true, text: 'Load (kg)' },
            },
            x: { title: { display: true, text: 'Section' } },
        },
    })

    /** 🧮 Helpers for exercise + section line charts */
    const getHistory = (filterFn) => {
        const dailyMap = {}
        workouts.forEach((w) => {
            if (!filterFn(w)) return
            const d = w.created_at.slice(0, 10)
            const load = (w.weight || 0) * (w.reps || 0)
            dailyMap[d] = (dailyMap[d] || 0) + load
        })
        return Object.entries(dailyMap)
            .map(([date, totalWeight]) => ({ date, totalWeight }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    // Weekly average per day for overall
    const prevWeekDays =
        new Set(prevWeekWorkouts.map((w) => w.created_at.slice(0, 10))).size ||
        1
    const currWeekDays =
        new Set(weekWorkouts.map((w) => w.created_at.slice(0, 10))).size || 1

    const prevWeekAvg = Math.round(
        Object.values(prevWeekStats).reduce(
            (sum, s) => sum + s.totalWeight,
            0
        ) / prevWeekDays
    )
    const currWeekAvg = Math.round(
        Object.values(weekStats).reduce((sum, s) => sum + s.totalWeight, 0) /
            currWeekDays
    )

    const weeklyAvgBarData = {
        labels: ['Previous Week', 'Current Week'],
        datasets: [
            {
                label: 'Weekly Avg Load (kg/day)',
                data: [prevWeekAvg, currWeekAvg],
                backgroundColor: [
                    'rgba(255,99,132,0.5)',
                    'rgba(75,192,192,0.6)',
                ],
            },
        ],
    }

    const weeklyAvgBarOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Weekly Average Comparison' },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg/day)' },
            },
            x: { title: { display: true, text: 'Week' } },
        },
    }

    return (
        <div className="summary-container">
            {/* === TOTAL SUMMARY === */}
            <div className="summary-section">
                <h2
                    className="collapsible-header"
                    onClick={() => toggleSection('total')}
                >
                    🧮 Overall Summary
                </h2>
                {openSections.total && (
                    <>
                        <div className="bar-chart-container">
                            <Bar
                                data={createComparisonBarData()}
                                options={barOptions('Current vs Previous Week')}
                            />
                        </div>
                        <div
                            className="bar-chart-container"
                            style={{ marginTop: '20px' }}
                        >
                            <Bar
                                data={weeklyAvgBarData}
                                options={weeklyAvgBarOptions}
                            />
                        </div>
                        <div className="section-totals">
                            <span>
                                Overall Load (This Week):{' '}
                                <strong>
                                    {Object.values(weekStats).reduce(
                                        (s, a) => s + a.totalWeight,
                                        0
                                    )}{' '}
                                    kg
                                </strong>
                            </span>
                            <span>
                                Δ vs Last Week:{' '}
                                <strong
                                    className={
                                        comparison.overallDiff > 0
                                            ? 'positive'
                                            : comparison.overallDiff < 0
                                            ? 'negative'
                                            : 'neutral'
                                    }
                                >
                                    {comparison.overallDiff > 0 ? '+' : ''}
                                    {comparison.overallDiff} kg
                                </strong>
                            </span>
                            <span>
                                Weekly Avg Δ:{' '}
                                <strong
                                    className={
                                        comparison.overallAvgDiff > 0
                                            ? 'positive'
                                            : comparison.overallAvgDiff < 0
                                            ? 'negative'
                                            : 'neutral'
                                    }
                                >
                                    {comparison.overallAvgDiff > 0 ? '+' : ''}
                                    {comparison.overallAvgDiff} kg/day
                                </strong>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* === SECTION-BY-SECTION === */}
            {sections.map((type) => {
                const data = weekStats[type]
                const prev = prevWeekStats[type]

                const sectionAvgThisWeek =
                    (data?.totalWeight || 0) /
                    getWorkoutDaysCount(weekWorkouts, type)
                const sectionAvgPrevWeek =
                    (prev?.totalWeight || 0) /
                    getWorkoutDaysCount(prevWeekWorkouts, type)
                const sectionDiffAvg = Math.round(
                    sectionAvgThisWeek - sectionAvgPrevWeek
                )

                const sectionHistory = getHistory(
                    (w) => w.exercises?.type === type
                )

                return (
                    <div key={type} className="summary-section">
                        <h3
                            className="collapsible-header"
                            onClick={() => toggleSection(type)}
                        >
                            {type}{' '}
                            <span
                                className={
                                    sectionDiffAvg > 0
                                        ? 'positive'
                                        : sectionDiffAvg < 0
                                        ? 'negative'
                                        : 'neutral'
                                }
                            >
                                ({sectionDiffAvg > 0 ? '+' : ''}
                                {sectionDiffAvg} kg/day vs last week)
                            </span>
                        </h3>

                        {openSections[type] && (
                            <>
                                {/* Section Line Chart */}
                                {sectionHistory.length > 0 && (
                                    <div className="section-chart">
                                        <Line
                                            data={{
                                                labels: sectionHistory.map(
                                                    (h) => h.date
                                                ),
                                                datasets: [
                                                    {
                                                        label: `${type} Load`,
                                                        data: sectionHistory.map(
                                                            (h) => h.totalWeight
                                                        ),
                                                        borderColor: '#1f78b4',
                                                        tension: 0.3,
                                                        fill: false,
                                                    },
                                                ],
                                            }}
                                            options={barOptions(
                                                `${type} Load Over Time`
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Exercise breakdown */}
                                <div className="exercise-cards">
                                    {Object.entries(data?.exercises || {}).map(
                                        ([name, statsEx]) => {
                                            const exHistory = getHistory(
                                                (w) =>
                                                    w.exercises?.name ===
                                                        name &&
                                                    w.exercises?.type === type
                                            )

                                            const exChart = {
                                                labels: exHistory.map(
                                                    (h) => h.date
                                                ),
                                                datasets: [
                                                    {
                                                        label: name,
                                                        data: exHistory.map(
                                                            (h) => h.totalWeight
                                                        ),
                                                        borderColor: '#2e8b57',
                                                        tension: 0.3,
                                                        fill: false,
                                                    },
                                                ],
                                            }

                                            return (
                                                <div
                                                    key={name}
                                                    className="exercise-card"
                                                >
                                                    <div className="exercise-header">
                                                        {name}
                                                    </div>
                                                    <div className="exercise-info">
                                                        <span>
                                                            Total Weight:{' '}
                                                            {
                                                                statsEx.totalWeight
                                                            }{' '}
                                                            kg
                                                        </span>
                                                        <span>
                                                            Total Reps:{' '}
                                                            {statsEx.totalReps ||
                                                                0}
                                                        </span>
                                                        <span>
                                                            Best Set:{' '}
                                                            {statsEx.bestWeight ||
                                                                0}{' '}
                                                            kg·rep
                                                        </span>
                                                    </div>
                                                    {exHistory.length > 0 && (
                                                        <div className="exercise-chart">
                                                            <Line
                                                                data={exChart}
                                                                options={{
                                                                    responsive: true,
                                                                    plugins: {
                                                                        legend: {
                                                                            display: false,
                                                                        },
                                                                    },
                                                                    scales: {
                                                                        y: {
                                                                            beginAtZero: true,
                                                                        },
                                                                    },
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
