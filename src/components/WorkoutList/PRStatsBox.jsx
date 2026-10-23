// Collapsible box showing PR stats for a single exercise
export default function PRStatsBox({
    exercisePR,
    setPR,
    todayLoad,
    progress,
    remaining,
    totalReps,
    bestSet,
}) {
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
        </div>
    )
}

