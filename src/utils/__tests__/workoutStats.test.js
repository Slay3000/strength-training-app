import {
    getExerciseHistoryStats,
    computeWeeklySectionAverages,
    computePrevStatsBySectionAndExercise,
    getPRSetIds,
} from '../workoutStats'

describe('getExerciseHistoryStats', () => {
    test('returns null fields when workouts is empty or exerciseId is missing', () => {
        expect(getExerciseHistoryStats([], 'ex-1')).toEqual({
            last: null,
            max: null,
            delta: null,
        })
        expect(getExerciseHistoryStats(null, 'ex-1')).toEqual({
            last: null,
            max: null,
            delta: null,
        })
        expect(getExerciseHistoryStats([{ exercise_id: 'ex-1' }], null)).toEqual({
            last: null,
            max: null,
            delta: null,
        })
    })

    test('finds most recent set (last), max load set (max), and delta vs previous set', () => {
        const workouts = [
            {
                id: 1,
                exercise_id: 'bench-press',
                weight: 80,
                reps: 10, // load 800
                created_at: '2026-10-10T10:00:00Z',
            },
            {
                id: 2,
                exercise_id: 'bench-press',
                weight: 100,
                reps: 10, // load 1000 -> max!
                created_at: '2026-10-15T10:00:00Z',
            },
            {
                id: 3,
                exercise_id: 'bench-press',
                weight: 90,
                reps: 10, // load 900 -> last!
                created_at: '2026-10-20T10:00:00Z',
            },
            {
                id: 4,
                exercise_id: 'squat', // different exercise
                weight: 140,
                reps: 5,
                created_at: '2026-10-21T10:00:00Z',
            },
        ]

        const stats = getExerciseHistoryStats(workouts, 'bench-press')

        expect(stats.last.id).toBe(3) // 2026-10-20
        expect(stats.max.id).toBe(2) // 1000 load
        // delta: last load (900) - second to last load (1000) = -100
        expect(stats.delta).toBe(-100)
    })

    test('delta is null when there is only one entry for the exercise', () => {
        const workouts = [
            {
                id: 1,
                exercise_id: 'deadlift',
                weight: 150,
                reps: 5,
                created_at: '2026-10-20T10:00:00Z',
            },
        ]
        const stats = getExerciseHistoryStats(workouts, 'deadlift')
        expect(stats.last.id).toBe(1)
        expect(stats.max.id).toBe(1)
        expect(stats.delta).toBeNull()
    })
})

describe('computeWeeklySectionAverages', () => {
    test('returns empty structures when allWorkouts is empty', () => {
        expect(computeWeeklySectionAverages([])).toEqual({
            overall: {},
            sections: {},
        })
        expect(computeWeeklySectionAverages(null)).toEqual({
            overall: {},
            sections: {},
        })
    })
})

describe('computePrevStatsBySectionAndExercise', () => {
    test('returns empty structures for empty input', () => {
        expect(computePrevStatsBySectionAndExercise([])).toEqual({
            sections: {},
            exercises: {},
            weeklyAverages: {},
            overall: {},
        })
    })
})

describe('getPRSetIds (badge bug prevention)', () => {
    const todaySets = [
        { id: 1, reps: 11, weight: 20 },
        { id: 2, reps: 15, weight: 20 }, // best set
        { id: 3, reps: 11, weight: 20 },
        { id: 4, reps: 14, weight: 20 },
    ]

    test('no sets receive PR badge if previous max weight was already 20 kg', () => {
        const priorWorkouts = [{ id: 99, weight: 20, reps: 10 }]
        const { weightPRSetIds, e1RMPRSetIds } = getPRSetIds(todaySets, priorWorkouts)

        expect(weightPRSetIds.size).toBe(0)
        // Set 2 e1RM is 20 * (1 + 15/30) = 30; prior e1RM is 20 * (1 + 10/30) = 26.6
        // Set 2 gets e1RM PR because reps beat prior, but none get weight PR
        expect(weightPRSetIds.has(1)).toBe(false)
        expect(weightPRSetIds.has(2)).toBe(false)
        expect(weightPRSetIds.has(3)).toBe(false)
        expect(weightPRSetIds.has(4)).toBe(false)
    })

    test('only the single best set receives Weight PR when exceeding previous max', () => {
        const priorWorkouts = [{ id: 99, weight: 15, reps: 10 }]
        const { weightPRSetIds } = getPRSetIds(todaySets, priorWorkouts)

        // Only Set 2 (15 reps @ 20 kg) gets Weight PR! Sets 1, 3, 4 must NOT have it
        expect(weightPRSetIds.size).toBe(1)
        expect(weightPRSetIds.has(2)).toBe(true)
        expect(weightPRSetIds.has(1)).toBe(false)
        expect(weightPRSetIds.has(3)).toBe(false)
        expect(weightPRSetIds.has(4)).toBe(false)
    })

    test('no sets receive PR badge on the first workout for an exercise (initial baseline)', () => {
        const { weightPRSetIds, e1RMPRSetIds } = getPRSetIds(todaySets, [])
        expect(weightPRSetIds.size).toBe(0)
        expect(e1RMPRSetIds.size).toBe(0)
    })
})


