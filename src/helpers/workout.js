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
        const date = new Date(w.created_at).toISOString().slice(0, 10)
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
export function computePrevStatsBySectionAndExercise(
    allWorkouts = [],
    currentDateLocale
) {
    if (!Array.isArray(allWorkouts) || allWorkouts.length === 0) {
        return { sections: {}, exercises: {} }
    }

    // Format helper
    const getLocalDate = (created_at) => {
        try {
            if (!created_at) return null
            return new Date(created_at).toISOString().slice(0, 10)
        } catch {
            return null
        }
    }

    // Group by date
    const byDate = allWorkouts.reduce((acc, w) => {
        const d = getLocalDate(w.created_at) || 'Unknown'
        acc[d] = acc[d] || []
        acc[d].push(w)
        return acc
    }, {})

    // Normalize date
    const todayLocale =
        currentDateLocale || new Date().toISOString().slice(0, 10)

    const localeFromDate = (dateObj) => dateObj.toISOString().slice(0, 10)
    const decDays = (dateObj, n = 1) => {
        const d = new Date(dateObj)
        d.setDate(d.getDate() - n)
        return d
    }

    const MAX_LOOKBACK_DAYS = 365
    let currentWorkouts = byDate[todayLocale] || []

    // Find **most recent previous day with any workouts**
    let scanDate = new Date(todayLocale)
    if (byDate[todayLocale]) scanDate = decDays(scanDate, 1)

    let prevDayWorkouts = []
    for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
        const key = localeFromDate(scanDate)
        if (byDate[key] && byDate[key].length) {
            prevDayWorkouts = byDate[key]
            break
        }
        scanDate = decDays(scanDate, 1)
    }

    const totalWeight = (sets) =>
        sets.reduce(
            (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
            0
        )

    const groupBy = (arr, fn) =>
        arr.reduce((acc, item) => {
            const key = fn(item) ?? 'Unknown'
            acc[key] = acc[key] || []
            acc[key].push(item)
            return acc
        }, {})

    // Group current and previous workouts by section
    const prevByType = groupBy(
        prevDayWorkouts,
        (w) => w.exercises?.type ?? 'Unknown'
    )
    const currByType = groupBy(
        currentWorkouts,
        (w) => w.exercises?.type ?? 'Unknown'
    )

    const allTypes = new Set([
        ...Object.keys(prevByType),
        ...Object.keys(currByType),
    ])
    const prevStats = { sections: {}, exercises: {} }

    for (const type of allTypes) {
        const prevTypeSets = prevByType[type] || []
        const currTypeSets = currByType[type] || []

        const prevTypeTotal = totalWeight(prevTypeSets)
        const currTypeTotal = totalWeight(currTypeSets)
        const sectionLoadToGo =
            prevTypeTotal > 0 ? prevTypeTotal - currTypeTotal : 0

        prevStats.sections[type] = {
            prevTotalWeight: prevTypeTotal,
            currentTotalWeight: currTypeTotal,
            loadToGo: sectionLoadToGo,
            exercises: {},
        }

        // Group exercises under this section
        const prevByExercise = groupBy(
            prevTypeSets,
            (w) => w.exercises?.name ?? 'Unknown'
        )
        const currByExercise = groupBy(
            currTypeSets,
            (w) => w.exercises?.name ?? 'Unknown'
        )
        const allExercises = new Set([
            ...Object.keys(prevByExercise),
            ...Object.keys(currByExercise),
        ])

        // --- computePrevStatsBySectionAndExercise (fixed loadToGo logic) ---
        for (const exName of allExercises) {
            const currSets = currByExercise[exName] || []

            // Look for previous sets for this exercise (recursive back-search)
            let prevSets = prevByExercise[exName] || []
            if (prevSets.length === 0) {
                let lookbackDate = decDays(new Date(todayLocale), 1)
                for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
                    const key = localeFromDate(lookbackDate)
                    const workoutsForDay = byDate[key] || []
                    const found = workoutsForDay.filter(
                        (w) =>
                            w.exercises?.name === exName &&
                            w.exercises?.type === type
                    )
                    if (found.length) {
                        prevSets = found
                        break
                    }
                    lookbackDate = decDays(lookbackDate, 1)
                }
            }

            const prevTotal = totalWeight(prevSets)
            const currTotal = totalWeight(currSets)

            // ✅ Only compute loadToGo relative to previous exercise total
            // and never double count or invert sign
            const loadToGo =
                prevSets.length > 0
                    ? Math.max(prevTotal - currTotal, -(currTotal - prevTotal)) // ensures correct sign
                    : 0

            const lastMaxWeight = prevSets.length
                ? Math.max(...prevSets.map((s) => Number(s.weight) || 0))
                : 0
            const totalReps = currSets.reduce(
                (sum, s) => sum + (Number(s.reps) || 0),
                0
            )
            const bestSet = currSets.length
                ? Math.max(
                      ...currSets.map(
                          (s) => (Number(s.weight) || 0) * (Number(s.reps) || 0)
                      )
                  )
                : 0

            prevStats.sections[type].exercises[exName] = {
                prevTotalWeight: prevTotal,
                currentTotalWeight: currTotal,
                loadToGo,
                lastMaxWeight,
                totalWeight: currTotal,
                totalReps,
                bestSet,
            }

            prevStats.exercises[exName] = {
                prevTotalWeight: prevTotal,
                currentTotalWeight: currTotal,
                loadToGo,
                lastMaxWeight,
            }
        }
    }

    return prevStats
}
