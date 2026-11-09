import { Line } from 'react-chartjs-2'
import { calculate1RM } from '../../utils/fitnessCalc'
import { exerciseLineOptions } from '../../utils/chartOptions'

// Collapsible box showing PR stats and 1RM progress graph for a single exercise
export default function PRStatsBox({
    exercisePR,
    setPR,
    todayLoad,
    progress,
    remaining,
    totalReps,
    bestSet,
    exerciseName,
    exerciseId,
    workouts = [],
}) {
    // Build daily estimated 1RM history for this exercise
    const dailyE1RM = {}
    if (exerciseId && workouts.length > 0) {
        workouts
            .filter((w) => w.exercise_id === exerciseId)
            .forEach((w) => {
                const ymd =
                    w.ymd ||
                    (w.created_at
                        ? new Date(w.created_at).toISOString().slice(0, 10)
                        : null)
                if (ymd) {
                    const e1rm = calculate1RM(w.weight, w.reps)
                    dailyE1RM[ymd] = Math.max(dailyE1RM[ymd] || 0, e1rm)
                }
            })
    }

    const sortedDates = Object.keys(dailyE1RM).sort()
    const chartValues = sortedDates.map((d) => dailyE1RM[d])
    const chartLabel = `${exerciseName || 'Exercise'} Est. 1RM (PR Over Time)`

    const chartData = {
        labels: sortedDates,
        datasets: [
            {
                label: chartLabel,
                borderColor: '#e31a1c',
                backgroundColor: 'rgba(227, 26, 28, 0.18)',
                data: chartValues,
                fill: true,
                tension: 0.3,
                pointRadius: sortedDates.length > 15 ? 2 : 4,
                pointBackgroundColor: '#e31a1c',
            },
        ],
    }

    return (
        <div className="pr-box">
            <div className="stats-block">
                <strong>Exercise PR:</strong> {exercisePR.toLocaleString()} kg
            </div>
            <div className="stats-block">
                <strong>Set PR:</strong> {setPR.toLocaleString()} kg
            </div>
            <div className="stats-block">
                <strong>Today Load:</strong> {todayLoad.toLocaleString()} kg
            </div>
            <div
                className={`stats-block ${
                    progress > 100
                        ? 'progress-new-pr'
                        : progress >= 90
                          ? 'progress-excellent'
                          : progress >= 70
                            ? 'progress-good'
                            : ''
                }`}
            >
                <strong>Progress:</strong> {progress.toFixed(1)} %
            </div>
            <div
                className={`stats-block ${
                    remaining <= 0
                        ? 'remaining-hit-pr'
                        : remaining <= exercisePR * 0.2
                          ? 'remaining-close'
                          : ''
                }`}
            >
                <strong>To PR:</strong> {remaining.toLocaleString()} kg
            </div>
            <div className="stats-block">
                <strong>Total Reps:</strong> {totalReps}
            </div>
            <div className="stats-block">
                <strong>Best Set:</strong> {bestSet} kg·rep
            </div>

            {/* 1PR / Est. 1RM Graph */}
            {sortedDates.length > 0 && (
                <div
                    className="exercise-chart"
                    style={{
                        width: '100%',
                        marginTop: '12px',
                        borderTop: '1px dashed var(--border)',
                        paddingTop: '10px',
                    }}
                >
                    <Line
                        data={chartData}
                        options={exerciseLineOptions(
                            chartLabel,
                            chartValues,
                            'Est. 1RM (kg)',
                        )}
                    />
                </div>
            )}
        </div>
    )
}

