import { Bar } from 'react-chartjs-2'

// Overall weekly summary stats + two bar charts
export default function OverallSummarySection({
    currentWeek,
    previousWeek,
    weekComparison,
    bestOverallWeekLoad,
    weeklyAvgBarData,
    weeklyAvgBarOptions,
    sectionComparisonBarData,
    sectionBarOpts,
    weekStartDate,
    today,
    toYMD,
    isOpen,
    onToggle,
}) {
    return (
        <div className="summary-section">
            <h2 className="collapsible-header" onClick={onToggle}>
                🧮 Overall Summary ({toYMD(weekStartDate)} — {toYMD(today)})
            </h2>

            {isOpen && (
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

                    <div className="bar-chart-container" style={{ marginTop: 20 }}>
                        <Bar
                            data={weeklyAvgBarData}
                            options={{
                                ...weeklyAvgBarOptions,
                                plugins: { legend: { display: false } },
                            }}
                        />
                    </div>
                    <div className="bar-chart-container" style={{ marginTop: 30 }}>
                        <Bar data={sectionComparisonBarData} options={sectionBarOpts} />
                    </div>
                </>
            )}
        </div>
    )
}

