import { WorkoutDay, WorkoutWeek, WorkoutMonth } from '../models/workoutModels'

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

    // 🗓️ Helpers
    const getLocalDate = (d) => new Date(d).toISOString().slice(0, 10)
    const todayStr = getLocalDate(new Date())

    // 🧩 Split workouts by day
    const byDate = allWorkouts.reduce((acc, w) => {
        const date = getLocalDate(w.created_at)
        if (!acc[date]) acc[date] = []
        acc[date].push(w)
        return acc
    }, {})

    const sortedDates = Object.keys(byDate).sort()
    const prevDates = sortedDates.filter((d) => d < todayStr)
    const currWorkouts = byDate[todayStr] || []
    const prevWorkouts = prevDates.flatMap((d) => byDate[d] || [])

    const currDay = new WorkoutDay(todayStr, currWorkouts)
    const prevDay = new WorkoutDay(prevDates.at(-1) || todayStr, prevWorkouts)

    // 🔁 Compare day-over-day
    const dailyComparison = prevDay.compareTo(currDay)

    // -------------------------------------------------
    // 📆 Weekly stats
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const oneWeekAgo = new Date(monday)
    oneWeekAgo.setDate(monday.getDate() - 7)

    const thisWeekWorkouts = allWorkouts.filter(
        (w) => new Date(w.created_at) >= monday
    )
    const lastWeekWorkouts = allWorkouts.filter(
        (w) =>
            new Date(w.created_at) >= oneWeekAgo &&
            new Date(w.created_at) < monday
    )

    const thisWeek = new WorkoutWeek(monday, thisWeekWorkouts)
    const lastWeek = new WorkoutWeek(oneWeekAgo, lastWeekWorkouts)
    const weekComparison = thisWeek.compareTo(lastWeek)

    // -------------------------------------------------
    // 🗓️ Monthly stats
    const thisMonth = new WorkoutMonth(
        new Date(today.getFullYear(), today.getMonth(), 1),
        allWorkouts
    )
    const lastMonth = new WorkoutMonth(
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
        allWorkouts
    )
    const monthComparison = thisMonth.compareTo(lastMonth)

    // -------------------------------------------------
    // 🧮 Build final prevStats for UI
    const prevStats = {
        sections: {},
        exercises: {},
        weeklyAverages: {},
        overall: {},
    }

    // Fill sections + exercises (from dailyComparison)
    for (const [section, data] of Object.entries(dailyComparison.sections)) {
        prevStats.sections[section] = {
            prevTotalWeight: 0,
            currentTotalWeight: 0,
            loadToGo: data.loadToGo,
            exercises: {},
        }

        for (const [name, ex] of Object.entries(data.exercises)) {
            prevStats.sections[section].exercises[name] = {
                prevTotalWeight: ex.prevTotalWeight,
                currentTotalWeight: ex.currentTotalWeight,
                loadToGo: ex.loadToGo,
            }
            prevStats.exercises[name] = ex

            prevStats.sections[section].prevTotalWeight += ex.prevTotalWeight
            prevStats.sections[section].currentTotalWeight +=
                ex.currentTotalWeight
        }
    }

    prevStats.overall = {
        prevTotalWeight: dailyComparison.overall.prevTotalWeight,
        currentTotalWeight: dailyComparison.overall.currentTotalWeight,
        loadToGo: dailyComparison.overall.loadToGo,
    }

    prevStats.weeklyAverages = {
        ...weekComparison,
    }

    prevStats.monthlyAverages = {
        ...monthComparison,
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

export function calculateSectionStats(workouts) {
    const stats = {}

    workouts.forEach((w) => {
        const type = w.exercises?.type || 'Unknown'
        const name = w.exercises?.name || 'Unknown'

        if (!stats[type]) stats[type] = { totalWeight: 0, exercises: {} }

        const weightForSet = (w.reps || 0) * (w.weight || 0)
        stats[type].totalWeight += weightForSet

        if (!stats[type].exercises[name]) {
            stats[type].exercises[name] = {
                totalWeight: 0,
                bestWeight: 0,
                totalReps: 0,
                bestSet: 0,
            }
        }

        stats[type].exercises[name].totalWeight += weightForSet
        stats[type].exercises[name].totalReps += w.reps || 0
        stats[type].exercises[name].bestWeight = Math.max(
            stats[type].exercises[name].bestWeight,
            w.weight || 0
        )
        stats[type].exercises[name].bestSet = Math.max(
            stats[type].exercises[name].bestSet,
            weightForSet
        )
    })

    return stats
}

// ---------------------------
// Compute weekly comparison
// ---------------------------
export function calculateWeeklyComparison(prevWeekWorkouts, currWeekWorkouts) {
    const getWorkoutDaysCount = (workouts, section = null) => {
        const days = new Set(
            workouts
                .filter((w) => (section ? w.exercises?.type === section : true))
                .map((w) => w.created_at.slice(0, 10))
        )
        return days.size || 1
    }

    const weekStats = calculateSectionStats(currWeekWorkouts)
    const prevWeekStats = calculateSectionStats(prevWeekWorkouts)

    const allSections = new Set([
        ...Object.keys(weekStats),
        ...Object.keys(prevWeekStats),
    ])

    const diffBySection = {}
    const sectionDetails = {}

    const currDays = getWorkoutDaysCount(currWeekWorkouts)
    const prevDays = getWorkoutDaysCount(prevWeekWorkouts)
    allSections.forEach((type) => {
        const currTotal = weekStats[type]?.totalWeight || 0
        const prevTotal = prevWeekStats[type]?.totalWeight || 0

        const currAvg = currTotal / currDays
        const prevAvg = prevTotal / prevDays

        diffBySection[type] = Math.round(currAvg - prevAvg)
        sectionDetails[type] = {
            prevAvg: Math.round(prevAvg),
            currAvg: Math.round(currAvg),
            prevTotal: Math.round(prevTotal),
            currTotal: Math.round(currTotal),
            diff: Math.round(currAvg - prevAvg),
        }
    })

    const overallCurrTotal = Object.values(weekStats).reduce(
        (sum, s) => sum + s.totalWeight,
        0
    )
    const overallPrevTotal = Object.values(prevWeekStats).reduce(
        (sum, s) => sum + s.totalWeight,
        0
    )
    const overallCurrDays = getWorkoutDaysCount(currWeekWorkouts)
    const overallPrevDays = getWorkoutDaysCount(prevWeekWorkouts)

    const overallCurrAvg = overallCurrTotal / overallCurrDays
    const overallPrevAvg = overallPrevTotal / overallPrevDays
    const overallDiff = overallCurrAvg - overallPrevAvg

    return {
        diffBySection,
        sectionDetails,
        overall: {
            prevAvg: Math.round(overallPrevAvg),
            currAvg: Math.round(overallCurrAvg),
            diff: Math.round(overallDiff),
        },
    }
}
