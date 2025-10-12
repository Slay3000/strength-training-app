// helpers/workout.js

/**
 * Groups workouts by date, then by exercise type
 * @param {Array} workouts - Array of workout objects with exercises info
 * @returns {Object} - { date: { type: [workouts] } }
 */
export function groupWorkouts(workouts) {
    const byDate = {}

    workouts.forEach((w) => {
        const date = new Date(w.created_at).toLocaleDateString()
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown'

        if (!byDate[date]) byDate[date] = {}
        if (!byDate[date][type]) byDate[date][type] = {}
        if (!byDate[date][type][name]) byDate[date][type][name] = []

        byDate[date][type][name].push(w)
    })

    return byDate
}

export function calculateSectionStats(workouts) {
    const allTypes = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms']
    const stats = {}

    // Group workouts by type and date
    const grouped = {}
    allTypes.forEach((t) => (grouped[t] = {}))

    workouts.forEach((w) => {
        const type = w.exercises?.type || 'Unknown'
        const date = new Date(w.created_at).toISOString().split('T')[0] // YYYY-MM-DD
        const lifted = (w.reps || 0) * (w.weight || 0)
        if (!grouped[type][date]) grouped[type][date] = 0
        grouped[type][date] += lifted
    })

    // Compute stats
    allTypes.forEach((type) => {
        const dates = Object.keys(grouped[type]).sort() // ascending
        if (dates.length === 0) {
            stats[type] = { totalWeight: 0, weightToGo: 0 }
            return
        }

        const latestDate = dates[dates.length - 1]
        const totalWeight = grouped[type][latestDate]
        const prevWeight =
            dates.length >= 2 ? grouped[type][dates[dates.length - 2]] : 0

        stats[type] = {
            totalWeight,
            weightToGo: totalWeight - prevWeight,
        }
    })

    return stats
}
