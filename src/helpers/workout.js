// src/helpers/workout.js
// Only keep functions used in App.js

import { WorkoutDay, WorkoutWeek, WorkoutMonth } from '../models/workoutModels'

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
