// Strip shown at the top of today's workout view with visual progress bar toward last week's daily average
export default function TodaySummaryBar({ todayLoad, prevWeekAvg, toGoToday }) {
    const progressPercent =
        prevWeekAvg > 0 ? Math.round((todayLoad / prevWeekAvg) * 100) : 0
    const isGoalReached = progressPercent >= 100

    return (
        <div className="today-summary">
            <div className="today-summary-stats">
                <div className="stats-block">
                    <strong>Today Load:</strong> {todayLoad.toLocaleString()} kg
                </div>
                <div className="stats-block">
                    <strong>Last Week Avg:</strong> {prevWeekAvg.toLocaleString()} kg
                </div>
                <div
                    className={`stats-block ${
                        toGoToday < 0
                            ? 'positive'
                            : toGoToday > 0
                              ? 'negative'
                              : 'neutral'
                    }`}
                >
                    <strong>To Go Today:</strong>{' '}
                    {toGoToday > 0
                        ? `${toGoToday.toLocaleString()} kg`
                        : `+${Math.abs(toGoToday).toLocaleString()} kg`}
                </div>
            </div>

            {prevWeekAvg > 0 && (
                <div className="daily-progress-container">
                    <div className="daily-progress-header">
                        <span className="daily-progress-label">
                            {isGoalReached
                                ? '🔥 Beat Last Week!'
                                : 'Daily Target Progress'}
                        </span>
                        <span className="daily-progress-value">
                            {progressPercent}% ({todayLoad.toLocaleString()} /{' '}
                            {prevWeekAvg.toLocaleString()} kg)
                        </span>
                    </div>
                    <div className="daily-progress-track">
                        <div
                            className={`daily-progress-fill ${
                                isGoalReached ? 'goal-reached' : ''
                            }`}
                            style={{
                                width: `${Math.min(100, progressPercent)}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
