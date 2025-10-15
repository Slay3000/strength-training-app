// helpers/workout.js

//     const byDate = {}

//     workouts.forEach((w) => {
//         const date = new Date(w.created_at).toLocaleDateString()
//         const type = w.exercises?.type || 'Unknown'
//         const name = w.exercises?.name || 'Unknown'

//         if (!byDate[date]) byDate[date] = {}
//         if (!byDate[date][type]) byDate[date][type] = {}
//         if (!byDate[date][type][name]) byDate[date][type][name] = []

//         byDate[date][type][name].push(w)
//     })

//     return byDate
// }

// Calculate section stats from workouts
// export function calculateSectionStats(workouts) {
//     if (!workouts || workouts.length === 0) return {}

//     // Structure: { type: { totalWeight, exercises: { name: { totalWeight, bestWeight } } } }
//     const stats = {}

//     workouts.forEach((w) => {
//         const type = w.exercises?.type || 'Unknown'
//         const name = w.exercises?.name || 'Unknown Exercise'
//         const load = (w.reps || 0) * (w.weight || 0)
//         const weight = w.weight || 0

//         if (!stats[type]) stats[type] = { totalWeight: 0, exercises: {} }
//         stats[type].totalWeight += load

//         if (!stats[type].exercises[name])
//             stats[type].exercises[name] = { totalWeight: 0, bestWeight: 0 }

//         stats[type].exercises[name].totalWeight += load
//         if (weight > stats[type].exercises[name].bestWeight)
//             stats[type].exercises[name].bestWeight = weight
//     })

//     return stats
// }

export function calculateSectionStats(workouts) {
    const stats = {}

    workouts.forEach((w) => {
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown'

        if (!stats[type]) stats[type] = { totalWeight: 0, exercises: {} }

        const weightForSet = (w.reps || 0) * (w.weight || 0)
        stats[type].totalWeight += weightForSet

        if (!stats[type].exercises[name]) {
            stats[type].exercises[name] = { totalWeight: 0, bestWeight: 0 }
        }

        stats[type].exercises[name].totalWeight += weightForSet
        stats[type].exercises[name].bestWeight = Math.max(
            stats[type].exercises[name].bestWeight,
            w.weight || 0
        )
    })

    return stats
}

// Optional: group workouts by date -> type -> exercise
export function groupWorkouts(workouts) {
    const grouped = {}
    workouts.forEach((w) => {
        const date = new Date(w.created_at).toLocaleDateString()
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown Exercise'

        if (!grouped[date]) grouped[date] = {}
        if (!grouped[date][type]) grouped[date][type] = {}
        if (!grouped[date][type][name]) grouped[date][type][name] = []

        grouped[date][type][name].push(w)
    })
    return grouped
}

export function calculateWeeklyStats(workouts) {
    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(now.getDate() - 7)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(now.getDate() - 14)

    const currentWeek = workouts.filter(
        (w) => new Date(w.created_at) >= oneWeekAgo
    )
    const previousWeek = workouts.filter(
        (w) =>
            new Date(w.created_at) >= twoWeeksAgo &&
            new Date(w.created_at) < oneWeekAgo
    )

    return {
        currentWeekStats: calculateSectionStats(currentWeek),
        previousWeekStats: calculateSectionStats(previousWeek),
    }
}

export function calculateWeightGoals(workouts) {
    const bests = {}

    workouts.forEach((w) => {
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unnamed'
        const total = w.reps * w.weight

        if (!bests[type]) bests[type] = { best: 0, exercises: {} }
        if (!bests[type].exercises[name])
            bests[type].exercises[name] = { best: 0 }

        bests[type].best = Math.max(bests[type].best, total)
        bests[type].exercises[name].best = Math.max(
            bests[type].exercises[name].best,
            total
        )
    })

    return bests
}

// Group workouts by type -> exercises -> sets (for current day)
export function groupWorkoutsByType(workouts) {
    return workouts.reduce((acc, w) => {
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown'

        if (!acc[type]) acc[type] = {}
        if (!acc[type][name]) acc[type][name] = []

        acc[type][name].push(w)
        return acc
    }, {})
}
