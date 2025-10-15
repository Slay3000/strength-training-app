// src/utils/groupWorkoutStats.js
import {
    startOfDay,
    startOfWeek,
    startOfMonth,
    endOfDay,
    endOfWeek,
    endOfMonth,
} from 'date-fns'

export function groupWorkoutStats(workouts = []) {
    const now = new Date()

    const ranges = {
        day: [startOfDay(now), endOfDay(now)],
        week: [
            startOfWeek(now, { weekStartsOn: 1 }),
            endOfWeek(now, { weekStartsOn: 1 }),
        ],
        month: [startOfMonth(now), endOfMonth(now)],
    }

    const stats = {
        day: {},
        week: {},
        month: {},
    }

    for (const [period, [start, end]] of Object.entries(ranges)) {
        const filtered = workouts.filter((w) => {
            const created = new Date(w.created_at)
            return created >= start && created <= end
        })

        stats[period] = filtered.reduce((acc, w) => {
            const type = w.exercises?.type || 'Other'
            const name = w.exercises?.name || 'Unknown Exercise'

            if (!acc[type]) acc[type] = {}
            if (!acc[type][name]) {
                acc[type][name] = {
                    totalWeight: 0,
                    totalReps: 0,
                    bestSet: 0,
                    sets: 0,
                }
            }

            const exercise = acc[type][name]
            const setWeight = w.weight * w.reps

            exercise.totalWeight += setWeight
            exercise.totalReps += w.reps
            exercise.sets += 1
            exercise.bestSet = Math.max(exercise.bestSet, setWeight)

            return acc
        }, {})
    }

    return stats
}

export function getDailyExerciseHistory(workouts, exerciseName) {
    const dailyMap = {}

    workouts.forEach((w) => {
        if (w.exercises?.name !== exerciseName) return

        const day = w.created_at.slice(0, 10) // YYYY-MM-DD
        const total = (w.weight || 0) * (w.reps || 0)

        if (!dailyMap[day]) dailyMap[day] = 0
        dailyMap[day] += total
    })

    // Convert to sorted array
    return Object.entries(dailyMap)
        .map(([date, totalWeight]) => ({ date, totalWeight }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
}
