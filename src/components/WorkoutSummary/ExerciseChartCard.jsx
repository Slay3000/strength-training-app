import { Line } from 'react-chartjs-2'
import { calculate1RM } from '../../utils/fitnessCalc'
import { exerciseLineOptions } from '../../utils/chartOptions'
import { getExerciseHistoryStats } from '../../utils/workoutStats'

// Per-exercise card: stats row + metric toggle + historical line chart
export default function ExerciseChartCard({
    exName,
    exSets,
    sectionName,
    workouts,
    toYMD,
    exerciseMetric,
    onMetricChange,
}) {
    const totalWeight = exSets.reduce(
        (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
        0,
    )
    const totalReps = exSets.reduce((sum, s) => sum + (s.reps || 0), 0)
    const bestSet = exSets.reduce(
        (max, s) => Math.max(max, (s.weight || 0) * (s.reps || 0)),
        0,
    )
    const lastMax = Math.max(...exSets.map((s) => s.weight || 0))

    // Historical stats
    const { last, max, delta } = getExerciseHistoryStats(
        workouts,
        exSets[0]?.exercise_id,
    )

    // Build daily chart data
    const metric = exerciseMetric || 'load'
    const dailyMap = {}
    workouts
        .filter(
            (w) =>
                w.exercises?.name === exName &&
                w.exercises?.type === sectionName,
        )
        .forEach((w) => {
            const ymd = toYMD(w.created_at)
            if (metric === 'e1rm') {
                const e1rm = calculate1RM(w.weight, w.reps)
                dailyMap[ymd] = Math.max(dailyMap[ymd] || 0, e1rm)
            } else {
                dailyMap[ymd] = (dailyMap[ymd] || 0) + (w.weight || 0) * (w.reps || 0)
            }
        })

    const sortedDates = Object.keys(dailyMap).sort()
    const chartLabel =
        metric === 'e1rm'
            ? `${exName} Est. 1RM Over Time`
            : `${exName} Load Over Time`

    const exerciseChartData = {
        labels: sortedDates,
        datasets: [
            {
                label: chartLabel,
                borderColor: metric === 'e1rm' ? '#e31a1c' : '#1f78b4',
                backgroundColor:
                    metric === 'e1rm'
                        ? 'rgba(227, 26, 28, 0.2)'
                        : 'rgba(31, 120, 180, 0.2)',
                data: sortedDates.map((d) => dailyMap[d]),
                fill: true,
                tension: 0.3,
            },
        ],
    }

    return (
        <div className="exercise-card">
            <strong>{exName}</strong>
            <div className="stats-row">
                <div className="stats-block">
                    Total Weight: {totalWeight.toLocaleString()} kg
                </div>
                <div className="stats-block">Total Reps: {totalReps}</div>
                <div className="stats-block">Best Set: {bestSet} kg·rep</div>
                <div className="stats-block">Last Max: {lastMax} kg</div>
                {last && (
                    <div className="stats-block">
                        Last: {last.reps} × {last.weight} kg
                    </div>
                )}
                {delta !== null && (
                    <div
                        className={`stats-block ${delta >= 0 ? 'positive' : 'negative'}`}
                    >
                        Δ vs Previous: {delta >= 0 ? '+' : ''}
                        {delta} kg
                    </div>
                )}
                {max && (
                    <div className="stats-block">
                        Max: {max.reps} × {max.weight} kg
                    </div>
                )}
            </div>

            {/* Metric toggle */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 12,
                    marginBottom: 4,
                }}
            >
                <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
                    Graph Metric:
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        style={{
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            borderRadius: 4,
                            border: '1px solid #444',
                            background: metric === 'load' ? '#1f78b4' : '#222',
                            color: '#fff',
                            cursor: 'pointer',
                        }}
                        onClick={() => onMetricChange(exName, 'load')}
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
                            cursor: 'pointer',
                        }}
                        onClick={() => onMetricChange(exName, 'e1rm')}
                    >
                        Est. 1RM
                    </button>
                </div>
            </div>

            <div className="exercise-chart" style={{ marginTop: 6 }}>
                <Line
                    data={exerciseChartData}
                    options={exerciseLineOptions(
                        chartLabel,
                        sortedDates.map((d) => dailyMap[d]),
                        metric === 'e1rm' ? 'Est. 1RM (kg)' : 'Load (kg)',
                    )}
                />
            </div>
        </div>
    )
}

