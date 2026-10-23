// Overall recovery score + per-section recovery breakdown
export default function RecoveryScoreSection({ recoveryStats, openSections, toggleSection }) {
    return (
        <>
            {/* Overall Recovery Score */}
            <div
                className="summary-section"
                style={{ borderLeft: `5px solid ${recoveryStats.overall.color}` }}
            >
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
                        <strong>Status:</strong> {recoveryStats.overall.label}
                        <p style={{ fontSize: '0.8rem', color: '#999', margin: '4px 0 0' }}>
                            Based on volume relative to best capacity and training frequency.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recovery by Section */}
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
                                <div key={sectionName} className="exercise-card">
                                    <strong>{sectionName}</strong>
                                    <div className="stats-row">
                                        <div className="stats-block">
                                            <span
                                                style={{
                                                    fontSize: '1.2rem',
                                                    fontWeight: 'bold',
                                                    color: stats.color,
                                                }}
                                            >
                                                {stats.score}%
                                            </span>
                                        </div>
                                        <div className="stats-block">
                                            <strong>Status:</strong> {stats.label}
                                            {stats.bestLoad > 0 && stats.currentLoad > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                                                    {Math.round((stats.currentLoad / stats.bestLoad) * 100)}% of best week ({Math.round(stats.currentLoad).toLocaleString()} / {Math.round(stats.bestLoad).toLocaleString()} kg)
                                                </div>
                                            )}
                                            {stats.bestLoad > 0 && stats.currentLoad === 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                                                    Rested this week (best: {Math.round(stats.bestLoad).toLocaleString()} kg)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

