import { useState, useEffect } from 'react'
import { computeSectionGaps } from '../../utils/workoutStats'
import { fetchExercises } from '../../services/exercisesService'
import './SuggestionsPage.css'

export default function SuggestionsPage({ workouts = [], onSelectExercise }) {
    const [exercises, setExercises] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchExercises().then(({ data }) => {
            setExercises(data || [])
            setLoading(false)
        })
    }, [])

    if (loading) return <div className="suggestions-loading">Loading suggestions…</div>

    const gaps = computeSectionGaps(workouts)

    // Only show sections that are actually lagging (gap > 0) and have prior data
    const lagging = gaps.filter((g) => g.gap > 0)

    if (lagging.length === 0) {
        const hasHistory = gaps.length > 0
        return (
            <div className="suggestions-empty">
                {hasHistory
                    ? '🏆 Great work — all muscle groups are on track this week!'
                    : 'Not enough history yet — keep training!'}
            </div>
        )
    }

    // Build a map: section -> exercises sorted by recency then alpha
    const recentExerciseDate = {} // exerciseId -> most recent date string
    workouts.forEach((w) => {
        const id = w.exercise_id
        const date = w.created_at ? new Date(w.created_at).toISOString().slice(0, 10) : ''
        if (!recentExerciseDate[id] || date > recentExerciseDate[id]) {
            recentExerciseDate[id] = date
        }
    })

    function formatTimeAgo(dateStr) {
        if (!dateStr) return 'Never'
        const now = new Date()
        const then = new Date(dateStr)
        const diffDays = Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)))
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays}d ago`
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7)
            return `${weeks}w ago`
        }
        const months = Math.floor(diffDays / 30)
        return `${months}mo ago`
    }

    function getSuggestionsForSection(section) {
        const sectionExercises = exercises.filter((e) => e.type === section)
        const now = new Date()

        const withRecency = sectionExercises.map((e) => {
            const dateStr = recentExerciseDate[e.id] || null
            const daysAgo = dateStr
                ? Math.floor((now - new Date(dateStr)) / (1000 * 60 * 60 * 24))
                : Infinity
            return {
                ...e,
                dateStr,
                daysAgo,
                timeAgo: formatTimeAgo(dateStr),
            }
        })

        // Recent favorites: trained within last 14 days, sorted most recent first
        const recent = withRecency
            .filter((e) => e.daysAgo <= 14)
            .sort((a, b) => a.daysAgo - b.daysAgo)
            .slice(0, 3)

        // Neglected: >14 days ago or never logged, sorted oldest / never first
        const neglected = withRecency
            .filter((e) => e.daysAgo > 14)
            .sort((a, b) => {
                if (a.daysAgo !== b.daysAgo) return b.daysAgo - a.daysAgo
                return a.name.localeCompare(b.name)
            })
            .slice(0, 3)

        // Fallback: if recent is empty (e.g. haven't trained this section in 2+ weeks),
        // take the most recent logged exercise for recent if one exists
        if (recent.length === 0 && withRecency.length > 0) {
            const logged = withRecency
                .filter((e) => e.daysAgo !== Infinity)
                .sort((a, b) => a.daysAgo - b.daysAgo)
            if (logged.length > 0) {
                recent.push(logged[0])
            }
        }

        return { recent, neglected, allEmpty: withRecency.length === 0 }
    }

    return (
        <div className="suggestions-page">
            <h2 className="suggestions-title">💡 Today's Suggestions</h2>
            <p className="suggestions-subtitle">
                Muscle groups lagging behind your 4-week average
            </p>

            <div className="suggestions-cards">
                {lagging.map((item) => {
                    const { section, currentLoad, avgLoad, gap, percentOfAvg } = item
                    const suggestions = getSuggestionsForSection(section)

                    return (
                        <div key={section} className="suggestion-card">
                            <div className="suggestion-card-header">
                                <span className="suggestion-section-name">{section}</span>
                                <span className="suggestion-gap-badge">−{gap} kg</span>
                            </div>

                            <div className="suggestion-volume-row">
                                <span className="suggestion-volume-text">
                                    This week: <strong>{currentLoad} kg</strong>
                                    &nbsp;/&nbsp;avg: <strong>{avgLoad} kg</strong>
                                </span>
                            </div>

                            <div className="suggestion-bar-wrap">
                                <div
                                    className="suggestion-bar-fill"
                                    style={{ width: `${Math.min(percentOfAvg, 100)}%` }}
                                />
                                <span className="suggestion-bar-label">{percentOfAvg}% of avg</span>
                            </div>

                            {suggestions.allEmpty ? (
                                <p className="suggestion-no-exercises">
                                    No exercises found for this section.
                                </p>
                            ) : (
                                <div className="suggestion-subsections">
                                    {suggestions.recent.length > 0 && (
                                        <div className="suggestion-subgroup">
                                            <div className="suggestion-subgroup-title">
                                                🔥 Recent ({suggestions.recent.length}):
                                            </div>
                                            <div className="suggestion-chips">
                                                {suggestions.recent.map((ex) => (
                                                    <button
                                                        key={ex.id}
                                                        className="suggestion-chip"
                                                        onClick={() => onSelectExercise && onSelectExercise(ex.name)}
                                                    >
                                                        {ex.name}
                                                        {ex.daysAgo > 0 && ex.daysAgo !== Infinity && (
                                                            <span className="chip-time-badge">{ex.timeAgo}</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {suggestions.neglected.length > 0 && (
                                        <div className="suggestion-subgroup">
                                            <div className="suggestion-subgroup-title">
                                                ⏳ Haven't done in a while ({suggestions.neglected.length}):
                                            </div>
                                            <div className="suggestion-chips">
                                                {suggestions.neglected.map((ex) => (
                                                    <button
                                                        key={ex.id}
                                                        className="suggestion-chip suggestion-chip-neglected"
                                                        onClick={() => onSelectExercise && onSelectExercise(ex.name)}
                                                    >
                                                        {ex.name}
                                                        <span className="chip-time-badge chip-time-neglected">
                                                            {ex.timeAgo}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
