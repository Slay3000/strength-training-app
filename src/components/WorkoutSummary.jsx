import { calculateSectionStats } from '../helpers/workout'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import './WorkoutSummary.css'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export default function WorkoutSummary({ workouts }) {
    if (!workouts?.length)
        return <div className="summary-container">No workouts yet.</div>

    const getWeekNumber = (date) => {
        const d = new Date(date)
        const oneJan = new Date(d.getFullYear(), 0, 1)
        const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000))
        return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)
    }

    const currentWeek = getWeekNumber(new Date())
    const weekGroups = workouts.reduce(
        (acc, w) => {
            const week = getWeekNumber(w.created_at)
            if (week === currentWeek) acc.current.push(w)
            else if (week === currentWeek - 1) acc.previous.push(w)
            return acc
        },
        { current: [], previous: [] }
    )

    const latestDate = workouts[0]?.created_at?.slice(0, 10)
    const prevWorkoutDate = workouts
        .map((w) => w.created_at.slice(0, 10))
        .filter((d) => d !== latestDate)[0]

    const lastWorkout = workouts.filter(
        (w) => w.created_at.slice(0, 10) === latestDate
    )
    const prevWorkout = workouts.filter(
        (w) => w.created_at.slice(0, 10) === prevWorkoutDate
    )

    const currentStats = calculateSectionStats(weekGroups.current)
    const previousStats = calculateSectionStats(weekGroups.previous)
    const lastStats = calculateSectionStats(lastWorkout)
    const prevStats = calculateSectionStats(prevWorkout)

    // Helper: generate historical data for an exercise
    const getExerciseHistory = (exerciseName) => {
        const history = workouts
            .filter((w) => w.exercises?.name === exerciseName)
            .map((w) => ({
                date: w.created_at.slice(0, 10),
                weight: w.weight,
            }))
        // sort by date ascending
        return history.sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    return (
        <div className="summary-container">
            {Object.entries(currentStats).map(([type, data]) => {
                const sectionPrevWeek = previousStats[type]?.totalWeight || 0
                const sectionPrevWorkout = prevStats[type]?.totalWeight || 0
                const sectionDiffWeek = data.totalWeight - sectionPrevWeek
                const sectionDiffWorkout = data.totalWeight - sectionPrevWorkout

                return (
                    <div key={type} className="summary-section">
                        <div className="section-header-row">
                            <h3 className="section-header">{type}</h3>
                            <div className="section-totals">
                                <span>
                                    Total Load:{' '}
                                    <strong>{data.totalWeight} kg</strong>
                                </span>
                                <span
                                    className={
                                        sectionDiffWeek > 0
                                            ? 'positive'
                                            : sectionDiffWeek < 0
                                            ? 'negative'
                                            : 'neutral'
                                    }
                                >
                                    Week Δ:{' '}
                                    {sectionDiffWeek > 0
                                        ? `+${sectionDiffWeek}`
                                        : sectionDiffWeek}{' '}
                                    kg
                                </span>
                                <span
                                    className={
                                        sectionDiffWorkout > 0
                                            ? 'positive'
                                            : sectionDiffWorkout < 0
                                            ? 'negative'
                                            : 'neutral'
                                    }
                                >
                                    Workout Δ:{' '}
                                    {sectionDiffWorkout > 0
                                        ? `+${sectionDiffWorkout}`
                                        : sectionDiffWorkout}{' '}
                                    kg
                                </span>
                            </div>
                        </div>

                        <div className="exercise-cards">
                            {Object.entries(data.exercises).map(
                                ([name, { bestWeight, totalWeight }]) => {
                                    const prevLoad =
                                        previousStats[type]?.exercises?.[name]
                                            ?.totalWeight || 0
                                    const lastLoad =
                                        prevStats[type]?.exercises?.[name]
                                            ?.totalWeight || 0
                                    const diffWeek = totalWeight - prevLoad
                                    const diffWorkout = totalWeight - lastLoad

                                    // Historical data for chart
                                    const history = getExerciseHistory(name)
                                    const chartData = {
                                        labels: history.map((h) => h.date),
                                        datasets: [
                                            {
                                                label: 'Best Weight',
                                                data: history.map(
                                                    (h) => h.weight
                                                ),
                                                fill: false,
                                                borderColor: '#2e8b57',
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
                                                    text: 'Weight (kg)',
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
                                            <div className="exercise-name">
                                                {name}
                                            </div>
                                            <div className="exercise-info">
                                                <span>
                                                    Best: {bestWeight} kg
                                                </span>
                                                <span>
                                                    Total: {totalWeight} kg
                                                </span>
                                                <span
                                                    className={
                                                        diffWeek > 0
                                                            ? 'positive'
                                                            : diffWeek < 0
                                                            ? 'negative'
                                                            : 'neutral'
                                                    }
                                                >
                                                    Δ Week:{' '}
                                                    {diffWeek > 0
                                                        ? `+${diffWeek}`
                                                        : diffWeek}{' '}
                                                    kg
                                                </span>
                                                <span
                                                    className={
                                                        diffWorkout > 0
                                                            ? 'positive'
                                                            : diffWorkout < 0
                                                            ? 'negative'
                                                            : 'neutral'
                                                    }
                                                >
                                                    Δ Last:{' '}
                                                    {diffWorkout > 0
                                                        ? `+${diffWorkout}`
                                                        : diffWorkout}{' '}
                                                    kg
                                                </span>
                                            </div>

                                            {/* Historical graph */}
                                            {history.length > 1 && (
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
                    </div>
                )
            })}
        </div>
    )
}
