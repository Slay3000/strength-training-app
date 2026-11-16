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

    function getSuggestionsForSection(section) {
        const sectionExercises = exercises.filter((e) => e.type === section)
        const sorted = [...sectionExercises].sort((a, b) => {
            const dateA = recentExerciseDate[a.id] || ''
            const dateB = recentExerciseDate[b.id] || ''
            if (dateB !== dateA) return dateB > dateA ? 1 : -1
            return a.name.localeCompare(b.name)
        })
        return sorted.slice(0, 3)
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

                            {suggestions.length > 0 ? (
                                <div className="suggestion-chips">
                                    {suggestions.map((ex) => (
                                        <button
                                            key={ex.id}
                                            className="suggestion-chip"
                                            onClick={() => onSelectExercise && onSelectExercise(ex.name)}
                                        >
                                            {ex.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="suggestion-no-exercises">
                                    No exercises found for this section.
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
