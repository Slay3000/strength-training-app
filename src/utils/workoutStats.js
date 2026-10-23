// Workout stats computation utilities
import { WorkoutDay, WorkoutWeek, WorkoutMonth } from '../models/workoutModels'
import { calculate1RM } from './fitnessCalc'



export function computePrevStatsBySectionAndExercise(allWorkouts = []) {
    if (!Array.isArray(allWorkouts) || allWorkouts.length === 0) {
        return { sections: {}, exercises: {}, weeklyAverages: {}, overall: {} }
    }

    const getLocalDate = (d) => new Date(d).toISOString().slice(0, 10)
    const todayStr = getLocalDate(new Date())

    const byDate = allWorkouts.reduce((acc, w) => {
        const date = getLocalDate(w.created_at)
        acc[date] = acc[date] || []
        acc[date].push(w)
        return acc
    }, {})

    const sortedDates = Object.keys(byDate).sort()
    const prevDates = sortedDates.filter((d) => d < todayStr)
    const currWorkouts = byDate[todayStr] || []
    const prevWorkouts = prevDates.flatMap((d) => byDate[d] || [])

    const currDay = new WorkoutDay(todayStr, currWorkouts)
    const prevDay = new WorkoutDay(prevDates.at(-1) || todayStr, prevWorkouts)
    const dailyComparison = prevDay.compareTo(currDay)

    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    const oneWeekAgo = new Date(monday)
    oneWeekAgo.setDate(monday.getDate() - 7)

    const thisWeekWorkouts = allWorkouts.filter(
        (w) => new Date(w.created_at) >= monday,
    )
    const lastWeekWorkouts = allWorkouts.filter(
        (w) =>
            new Date(w.created_at) >= oneWeekAgo &&
            new Date(w.created_at) < monday,
    )

    const thisWeek = new WorkoutWeek(monday, thisWeekWorkouts)
    const lastWeek = new WorkoutWeek(oneWeekAgo, lastWeekWorkouts)
    const weekComparison = thisWeek.compareTo(lastWeek)

    const thisMonth = new WorkoutMonth(
        new Date(today.getFullYear(), today.getMonth(), 1),
        allWorkouts,
    )
    const lastMonth = new WorkoutMonth(
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
        allWorkouts,
    )
    const monthComparison = thisMonth.compareTo(lastMonth)

    const prevStats = {
        sections: {},
        exercises: {},
        weeklyAverages: weekComparison,
        monthlyAverages: monthComparison,
        overall: {
            prevTotalWeight: dailyComparison.overall.prevTotalWeight,
            currentTotalWeight: dailyComparison.overall.currentTotalWeight,
            loadToGo: dailyComparison.overall.loadToGo,
        },
    }

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

    return prevStats
}

export function computeWeeklySectionAverages(allWorkouts = []) {
    if (!Array.isArray(allWorkouts) || allWorkouts.length === 0) {
        return { overall: {}, sections: {} }
    }

    const totalWeight = (sets) =>
        sets.reduce(
            (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
            0,
        )

    const today = new Date()
    const dayOfWeek = today.getDay()
    const diffToMonday = (dayOfWeek + 6) % 7
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - diffToMonday)
    currentWeekStart.setHours(0, 0, 0, 0)

    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(currentWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(currentWeekStart)
    previousWeekEnd.setMilliseconds(-1)

    const workoutsByDate = allWorkouts.reduce((acc, w) => {
        const date = new Date(w.created_at).toISOString().slice(0, 10)
        acc[date] = acc[date] || []
        acc[date].push(w)
        return acc
    }, {})

    const currentWeekDates = Object.keys(workoutsByDate).filter(
        (d) => new Date(d) >= currentWeekStart,
    )
    const previousWeekDates = Object.keys(workoutsByDate).filter(
        (d) =>
            new Date(d) >= previousWeekStart && new Date(d) <= previousWeekEnd,
    )

    const sectionTotals = {}
    const sectionDays = {}

    currentWeekDates.forEach((date) => {
        const byType = {}
        workoutsByDate[date].forEach((w) => {
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
        const byType = {}
        workoutsByDate[date].forEach((w) => {
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

    return {
        overall: {
            currentWeekAvg: Math.round(currWeekSum),
            previousWeekAvg: Math.round(prevWeekSum),
            loadToGo: Math.round(prevWeekSum - currWeekSum),
        },
        sections,
    }
}

/**
 * Computes historical stats (last set, max set, load delta vs previous) for an exercise.
 */
export function getExerciseHistoryStats(workouts, exerciseId) {
    if (!workouts || !exerciseId) {
        return { last: null, max: null, delta: null }
    }

    const exWorkouts = workouts.filter((w) => w.exercise_id === exerciseId)
    if (!exWorkouts.length) {
        return { last: null, max: null, delta: null }
    }

    const sorted = [...exWorkouts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )

    const last = sorted[0]
    const max = exWorkouts.reduce((m, w) => {
        const load = (w.weight || 0) * (w.reps || 0)
        const currentMax = (m.weight || 0) * (m.reps || 0)
        return load > currentMax ? w : m
    }, sorted[0])

    const delta =
        sorted.length > 1
            ? (last.weight || 0) * (last.reps || 0) -
              (sorted[1].weight || 0) * (sorted[1].reps || 0)
            : null

    return { last, max, delta }
}

/**
 * Determines which sets in today's workout achieved a new personal record compared to prior workouts.
 * Returns an object with Set of weightPRSetIds and e1RMPRSetIds.
 *
 * Rules:
 * 1. Must strictly beat prior workouts (> priorMax).
 * 2. If no prior workouts exist, no set is a PR (it's the initial baseline).
 * 3. At most ONE set per workout gets the Weight PR (the highest weight, tie-broken by highest reps).
 * 4. At most ONE set per workout gets the 1RM PR (the highest estimated 1RM).
 */
export function getPRSetIds(todaySets = [], priorWorkouts = []) {
    if (!todaySets?.length || !priorWorkouts?.length) {
        return { weightPRSetIds: new Set(), e1RMPRSetIds: new Set() }
    }

    const priorMaxWeight = Math.max(
        ...priorWorkouts.map((w) => w.weight || 0),
        0,
    )
    const priorMaxE1RM = Math.max(
        ...priorWorkouts.map((w) => calculate1RM(w.weight || 0, w.reps || 0)),
        0,
    )

    // Find the single best set for weight today that strictly beats priorMaxWeight
    let bestWeightSet = null
    todaySets.forEach((s) => {
        const weight = Number(s.weight) || 0
        const reps = Number(s.reps) || 0
        if (weight > priorMaxWeight) {
            if (
                !bestWeightSet ||
                weight > bestWeightSet.weight ||
                (weight === bestWeightSet.weight && reps > bestWeightSet.reps)
            ) {
                bestWeightSet = { id: s.id, weight, reps }
            }
        }
    })

    // Find the single best set for e1RM today that strictly beats priorMaxE1RM
    let bestE1RMSet = null
    todaySets.forEach((s) => {
        const e1rm = calculate1RM(s.weight, s.reps)
        if (e1rm > priorMaxE1RM) {
            if (!bestE1RMSet || e1rm > bestE1RMSet.e1rm) {
                bestE1RMSet = { id: s.id, e1rm }
            }
        }
    })

    const weightPRSetIds = new Set(bestWeightSet ? [bestWeightSet.id] : [])
    const e1RMPRSetIds = new Set(bestE1RMSet ? [bestE1RMSet.id] : [])

    return { weightPRSetIds, e1RMPRSetIds }
}


