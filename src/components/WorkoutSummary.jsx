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
import { calculateSectionStats } from '../helpers/workout'

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
    if (!workouts?.length)
        return <div className="summary-container">No workouts yet.</div>

    const todayStr = new Date().toISOString().slice(0, 10)
    const todayWorkouts = workouts.filter(
        (w) => w.created_at.slice(0, 10) === todayStr
    )

    // Get start of week and month
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const weekWorkouts = workouts.filter(
        (w) => new Date(w.created_at) >= weekStart
    )
    const monthWorkouts = workouts.filter(
        (w) => new Date(w.created_at) >= monthStart
    )

    // Calculate stats
    const todayStats = calculateSectionStats(todayWorkouts)
    const weekStats = calculateSectionStats(weekWorkouts)
    const monthStats = calculateSectionStats(monthWorkouts)

    const sections = Object.keys(todayStats)

    const createBarData = (statsObj) => {
        return {
            labels: Object.keys(statsObj),
            datasets: [
                {
                    label: 'Total Load',
                    data: Object.values(statsObj).map((s) => s.totalWeight),
                    backgroundColor: [
                        '#f87171', // Chest
                        '#60a5fa', // Back
                        '#34d399', // Legs
                        '#facc15', // Shoulders
                        '#a78bfa', // Arms
                        '#d1d5db', // Unknown
                    ],
                },
            ],
        }
    }

    const barOptions = (title) => ({
        responsive: true,
        plugins: {
            legend: { display: false },
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

    // Exercise history for line charts
    const getExerciseHistory = (exerciseName) => {
        const dailyMap = {}
        workouts.forEach((w) => {
            if (w.exercises?.name !== exerciseName) return
            const day = w.created_at.slice(0, 10)
            const total = (w.weight || 0) * (w.reps || 0)
            if (!dailyMap[day]) dailyMap[day] = 0
            dailyMap[day] += total
        })
        return Object.entries(dailyMap)
            .map(([date, totalWeight]) => ({ date, totalWeight }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    // Section history for line charts
    const getSectionHistory = (sectionName) => {
        const dailyMap = {}
        workouts.forEach((w) => {
            if (w.exercises?.type !== sectionName) return
            const day = w.created_at.slice(0, 10)
            const total = (w.weight || 0) * (w.reps || 0)
            if (!dailyMap[day]) dailyMap[day] = 0
            dailyMap[day] += total
        })
        return Object.entries(dailyMap)
            .map(([date, totalWeight]) => ({ date, totalWeight }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    return (
        <div className="summary-container">
            {/* Daily, weekly, monthly section bar charts */}
            {sections.length > 0 && (
                <>
                    <div className="bar-chart-container">
                        <Bar
                            data={createBarData(todayStats)}
                            options={barOptions('Today Section Load (kg)')}
                        />
                    </div>
                    <div className="bar-chart-container">
                        <Bar
                            data={createBarData(weekStats)}
                            options={barOptions('This Week Section Load (kg)')}
                        />
                    </div>
                    <div className="bar-chart-container">
                        <Bar
                            data={createBarData(monthStats)}
                            options={barOptions('This Month Section Load (kg)')}
                        />
                    </div>
                </>
            )}

            {/* Section and exercise details */}
            {Object.entries(todayStats).map(([type, data]) => {
                const sectionHistory = getSectionHistory(type)

                return (
                    <div key={type} className="summary-section">
                        <div className="section-header-row">
                            <h3 className="section-header">{type}</h3>
                            <div className="section-totals">
                                <span>
                                    Total Load:{' '}
                                    <strong>{data.totalWeight} kg</strong>
                                </span>
                            </div>
                        </div>

                        {/* Exercises */}
                        <div className="exercise-cards">
                            {Object.entries(data.exercises).map(
                                ([name, statsEx]) => {
                                    const history = getExerciseHistory(name)

                                    const chartData = {
                                        labels: history.map((h) => h.date),
                                        datasets: [
                                            {
                                                label: 'Exercise Daily Load',
                                                data: history.map(
                                                    (h) => h.totalWeight
                                                ),
                                                borderColor: '#2e8b57',
                                                fill: false,
                                                tension: 0.3,
                                            },
                                        ],
                                    }

                                    const chartOptions = {
                                        responsive: true,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: {
                                                title: {
                                                    display: true,
                                                    text: 'Date',
                                                },
                                            },
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: 'Load (kg)',
                                                },
                                                beginAtZero: true,
                                            },
                                        },
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
                                                    {statsEx.totalWeight} kg
                                                </span>
                                                <span>
                                                    Total Reps:{' '}
                                                    {statsEx.totalReps}
                                                </span>
                                                <span>
                                                    Best Set: {statsEx.bestSet}{' '}
                                                    kg·rep
                                                </span>
                                            </div>
                                            {history.length > 0 && (
                                                <div className="exercise-chart">
                                                    <Line
                                                        data={chartData}
                                                        options={chartOptions}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            )}
                        </div>

                        {/* Section historical chart */}
                        {sectionHistory.length > 0 && (
                            <div className="section-chart">
                                <h4>Section Daily Load Over Time</h4>
                                <Line
                                    data={{
                                        labels: sectionHistory.map(
                                            (h) => h.date
                                        ),
                                        datasets: [
                                            {
                                                label: 'Section Daily Load',
                                                data: sectionHistory.map(
                                                    (h) => h.totalWeight
                                                ),
                                                borderColor: '#1f78b4',
                                                fill: false,
                                                tension: 0.3,
                                            },
                                        ],
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: { legend: { display: true } },
                                        scales: {
                                            x: {
                                                title: {
                                                    display: true,
                                                    text: 'Date',
                                                },
                                            },
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: 'Load (kg)',
                                                },
                                                beginAtZero: true,
                                            },
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
