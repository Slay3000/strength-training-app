import { computeACWR } from '../../utils/recoveryScore'

const ZONE_COLORS = {
    undertraining: '#4caf50',
    optimal:       '#ffc107',
    'high-risk':   '#ff9800',
    danger:        '#f44336',
}

function acwrColor(zone) {
    return ZONE_COLORS[zone] || '#9e9e9e'
}

/**
 * ACWRSection — shows Acute:Chronic Workload Ratio overall + per muscle section.
 * Follows the same collapsible pattern as RecoveryScoreSection.
 */
export default function ACWRSection({ workouts, openSections, toggleSection }) {
    const acwr = computeACWR(workouts)
    const { overall, sections } = acwr

    const overallColor = overall.acwr !== null ? acwrColor(overall.zone) : '#9e9e9e'

    return (
        <>
            {/* Overall ACWR */}
            <div
                className="summary-section"
                style={{ borderLeft: `5px solid ${overallColor}` }}
            >
                <h2 className="collapsible-header">⚡ Fatigue Score (ACWR)</h2>
                <div className="stats-row">
                    <div className="stats-block">
                        <span
                            style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: overallColor,
                            }}
                        >
                            {overall.acwr !== null ? overall.acwr.toFixed(2) : '—'}
                        </span>
                    </div>
                    <div className="stats-block">
                        <strong>Zone:</strong> {overall.label}
                        <p style={{ fontSize: '0.8rem', color: '#999', margin: '4px 0 0' }}>
                            Acute (7-day avg) ÷ Chronic (28-day avg) daily volume.
                        </p>
                    </div>
                </div>
            </div>

            {/* ACWR by Section */}
            <div className="summary-section">
                <h2
                    className="collapsible-header"
                    onClick={() => toggleSection('acwrBySection')}
                >
                    🏋️ ACWR by Section
                </h2>
                {openSections.acwrBySection && (
                    <div className="exercise-breakdown">
                        {Object.keys(sections).length === 0 ? (
                            <p style={{ color: '#999', fontSize: '0.9rem' }}>
                                Not enough data — train for at least 28 days for a full ACWR.
                            </p>
                        ) : (
                            Object.entries(sections).map(([type, stats]) => {
                                const color = stats.acwr !== null ? acwrColor(stats.zone) : '#9e9e9e'
                                return (
                                    <div key={type} className="exercise-card">
                                        <strong>{type}</strong>
                                        <div className="stats-row">
                                            <div className="stats-block">
                                                <span
                                                    style={{
                                                        fontSize: '1.2rem',
                                                        fontWeight: 'bold',
                                                        color,
                                                    }}
                                                >
                                                    {stats.acwr !== null ? stats.acwr.toFixed(2) : '—'}
                                                </span>
                                            </div>
                                            <div className="stats-block">
                                                <strong>Zone:</strong> {stats.label}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
