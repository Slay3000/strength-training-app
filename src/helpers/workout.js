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

export function computePrevStatsBySectionAndExercise(allWorkouts = []) {
    if (!Array.isArray(allWorkouts) || allWorkouts.length === 0) {
        return { sections: {}, exercises: {}, weeklyAverages: {}, overall: {} }
    }

    const getLocalDate = (created_at) => {
        try {
            return new Date(created_at).toISOString().slice(0, 10)
        } catch {
            return 'Unknown'
        }
    }

    const todayStr = new Date().toISOString().slice(0, 10)

    const totalWeight = (sets) =>
        sets.reduce(
            (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
            0
        )

    const totalReps = (sets) =>
        sets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0)

    const bestSetValue = (sets) =>
        sets.length
            ? Math.max(
                  ...sets.map(
                      (s) => (Number(s.weight) || 0) * (Number(s.reps) || 0)
                  )
              )
            : 0

    // Group workouts by type and exercise
    const exercisesByType = {}
    allWorkouts.forEach((w) => {
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown'
        if (!exercisesByType[type]) exercisesByType[type] = {}
        if (!exercisesByType[type][name]) exercisesByType[type][name] = []
        exercisesByType[type][name].push(w)
    })

    const prevStats = {
        sections: {},
        exercises: {},
        weeklyAverages: {},
        overall: {},
    }
    let overallPrev = 0
    let overallCurr = 0

    for (const type of Object.keys(exercisesByType)) {
        const exercises = exercisesByType[type]
        let sectionPrevTotal = 0
        let sectionCurrTotal = 0
        prevStats.sections[type] = {
            exercises: {},
            prevTotalWeight: 0,
            currentTotalWeight: 0,
            loadToGo: 0,
        }

        for (const exName of Object.keys(exercises)) {
            const allSets = exercises[exName]
            const prevSets = allSets.filter(
                (s) => getLocalDate(s.created_at) !== todayStr
            )
            const currSets = allSets.filter(
                (s) => getLocalDate(s.created_at) === todayStr
            )

            const prevTotal = totalWeight(prevSets)
            const currTotal = totalWeight(currSets)
            const exerciseLoadToGo = prevTotal - currTotal
            const lastMaxWeight = prevSets.length
                ? Math.max(...prevSets.map((s) => Number(s.weight) || 0))
                : 0
            const totalRepsVal = totalReps(currSets)
            const bestSet = bestSetValue(currSets)

            prevStats.sections[type].exercises[exName] = {
                prevTotalWeight: prevTotal,
                currentTotalWeight: currTotal,
                loadToGo: exerciseLoadToGo,
                lastMaxWeight,
                totalWeight: currTotal,
                totalReps: totalRepsVal,
                bestSet,
            }

            prevStats.exercises[exName] = {
                prevTotalWeight: prevTotal,
                currentTotalWeight: currTotal,
                loadToGo: exerciseLoadToGo,
                lastMaxWeight,
            }

            sectionPrevTotal += prevTotal
            sectionCurrTotal += currTotal
        }

        prevStats.sections[type].prevTotalWeight = sectionPrevTotal
        prevStats.sections[type].currentTotalWeight = sectionCurrTotal
        prevStats.sections[type].loadToGo = sectionPrevTotal - sectionCurrTotal

        overallPrev += sectionPrevTotal
        overallCurr += sectionCurrTotal
    }

    // Weekly averages (Monday to Sunday)
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday
    const mondayThisWeek = new Date(today)
    mondayThisWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

    const mondayLastWeek = new Date(mondayThisWeek)
    mondayLastWeek.setDate(mondayThisWeek.getDate() - 7)

    const isInWeek = (d, start) => {
        const date = new Date(d)
        const end = new Date(start)
        end.setDate(end.getDate() + 7)
        return date >= start && date < end
    }

    const sectionsWeekly = {}
    for (const type of Object.keys(exercisesByType)) {
        const exercises = exercisesByType[type]

        const thisWeekSets = []
        const lastWeekSets = []

        Object.values(exercises).forEach((sets) => {
            sets.forEach((s) => {
                const date = new Date(s.created_at)
                if (isInWeek(date, mondayThisWeek)) thisWeekSets.push(s)
                else if (isInWeek(date, mondayLastWeek)) lastWeekSets.push(s)
            })
        })

        const sumWeight = (sets) => totalWeight(sets)
        const daysWithWorkouts = (sets) =>
            new Set(sets.map((s) => getLocalDate(s.created_at))).size || 1

        const currentWeekAvg = Math.round(
            sumWeight(thisWeekSets) / daysWithWorkouts(thisWeekSets)
        )
        const previousWeekAvg = Math.round(
            sumWeight(lastWeekSets) / daysWithWorkouts(lastWeekSets)
        )

        sectionsWeekly[type] = {
            currentWeekAvg,
            previousWeekAvg,
            loadToGo: previousWeekAvg - currentWeekAvg,
        }
    }

    prevStats.weeklyAverages = sectionsWeekly
    prevStats.overall = {
        currentWeekAvg: Object.values(sectionsWeekly).reduce(
            (sum, s) => sum + s.currentWeekAvg,
            0
        ),
        previousWeekAvg: Object.values(sectionsWeekly).reduce(
            (sum, s) => sum + s.previousWeekAvg,
            0
        ),
        loadToGo: Object.values(sectionsWeekly).reduce(
            (sum, s) => sum + s.loadToGo,
            0
        ),
    }

    return prevStats
}

export function computeWeeklySectionAverages(allWorkouts = []) {
    if (!Array.isArray(allWorkouts) || allWorkouts.length === 0) {
        return { overall: {}, sections: {} }
    }

    const totalWeight = (sets) =>
        sets.reduce(
            (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
            0
        )

    // --- Compute current and previous week (Monday to Sunday) ---
    const today = new Date()
    const dayOfWeek = today.getDay() // Sunday = 0
    const diffToMonday = (dayOfWeek + 6) % 7
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - diffToMonday)
    currentWeekStart.setHours(0, 0, 0, 0)

    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(currentWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(currentWeekStart)
    previousWeekEnd.setMilliseconds(-1)

    // Group workouts by date
    const workoutsByDate = allWorkouts.reduce((acc, w) => {
        const date = new Date(w.created_at).toISOString().slice(0, 10)
        if (!acc[date]) acc[date] = []
        acc[date].push(w)
        return acc
    }, {})

    // Filter current & previous week workouts
    const currentWeekDates = Object.keys(workoutsByDate).filter(
        (d) => new Date(d) >= currentWeekStart
    )
    const previousWeekDates = Object.keys(workoutsByDate).filter(
        (d) =>
            new Date(d) >= previousWeekStart && new Date(d) <= previousWeekEnd
    )

    // --- Section totals per week ---
    const sectionTotals = {}
    const sectionDays = {} // track how many days each section appeared

    currentWeekDates.forEach((date) => {
        const dayWorkouts = workoutsByDate[date]
        const byType = {}
        dayWorkouts.forEach((w) => {
            const type = w.exercises?.type ?? 'Unknown'
            byType[type] = byType[type] || []
            byType[type].push(w)
        })

        Object.entries(byType).forEach(([type, sets]) => {
            const dayTotal = totalWeight(sets)
            sectionTotals[type] = (sectionTotals[type] || 0) + dayTotal
            sectionDays[type] = (sectionDays[type] || 0) + 1
        })
    })

    const prevSectionTotals = {}
    const prevSectionDays = {}

    previousWeekDates.forEach((date) => {
        const dayWorkouts = workoutsByDate[date]
        const byType = {}
        dayWorkouts.forEach((w) => {
            const type = w.exercises?.type ?? 'Unknown'
            byType[type] = byType[type] || []
            byType[type].push(w)
        })

        Object.entries(byType).forEach(([type, sets]) => {
            const dayTotal = totalWeight(sets)
            prevSectionTotals[type] = (prevSectionTotals[type] || 0) + dayTotal
            prevSectionDays[type] = (prevSectionDays[type] || 0) + 1
        })
    })

    // --- Compute per-section weekly averages ---
    const allSections = new Set([
        ...Object.keys(sectionTotals),
        ...Object.keys(prevSectionTotals),
    ])

    const sections = {}
    let currWeekSum = 0
    let prevWeekSum = 0

    allSections.forEach((type) => {
        const currAvg =
            sectionDays[type] && sectionTotals[type]
                ? sectionTotals[type] / sectionDays[type]
                : 0
        const prevAvg =
            prevSectionDays[type] && prevSectionTotals[type]
                ? prevSectionTotals[type] / prevSectionDays[type]
                : 0

        sections[type] = {
            currentWeekAvg: Math.round(currAvg),
            previousWeekAvg: Math.round(prevAvg),
            loadToGo: Math.round(prevAvg - currAvg),
        }

        currWeekSum += currAvg
        prevWeekSum += prevAvg
    })

    const overall = {
        currentWeekAvg: Math.round(currWeekSum),
        previousWeekAvg: Math.round(prevWeekSum),
        loadToGo: Math.round(prevWeekSum - currWeekSum),
    }

    return { overall, sections }
}

function getWeeklyStats(allWorkouts, weekStartDate, weekEndDate) {
    const byType = {}
    const byDayType = {}

    allWorkouts.forEach((w) => {
        const date = new Date(w.created_at)
        if (date < weekStartDate || date > weekEndDate) return

        const type = w.exercises?.type || 'Unknown'
        const weight = Number(w.weight) || 0
        const reps = Number(w.reps) || 0
        const total = weight * reps
        const day = date.toISOString().slice(0, 10)

        // Sum by section
        byType[type] = (byType[type] || 0) + total

        // Track unique days per type
        if (!byDayType[type]) byDayType[type] = {}
        byDayType[type][day] = (byDayType[type][day] || 0) + total
    })

    // Compute avg per workout day
    const avgByType = {}
    Object.keys(byType).forEach((type) => {
        const days = Object.keys(byDayType[type]).length || 1
        avgByType[type] = Math.round(byType[type] / days)
    })

    return avgByType
}
