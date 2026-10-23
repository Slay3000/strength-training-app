import {
    computeTodayLoad,
    computeCurrentProportions,
    computeTargetProportions,
} from '../muscleStats'

describe('computeTodayLoad', () => {
    test('sums load (weight * reps) only for workouts on the given date', () => {
        const workouts = [
            { created_at: '2026-10-23T10:00:00Z', weight: 100, reps: 5 },
            { created_at: '2026-10-23T11:00:00Z', weight: 80, reps: 8 },
            { created_at: '2026-10-22T09:00:00Z', weight: 120, reps: 5 }, // yesterday
        ]

        expect(computeTodayLoad(workouts, '2026-10-23')).toBe(1140) // 500 + 640
    })

    test('returns 0 when no workouts match today', () => {
        const workouts = [
            { created_at: '2026-10-22T09:00:00Z', weight: 100, reps: 5 },
        ]
        expect(computeTodayLoad(workouts, '2026-10-23')).toBe(0)
        expect(computeTodayLoad([], '2026-10-23')).toBe(0)
    })
})

describe('computeCurrentProportions', () => {
    test('calculates percentage of total weekly load for each section', () => {
        const weeklySections = {
            Legs: { currentWeekAvg: 500 },
            Chest: { currentWeekAvg: 300 },
            Back: { currentWeekAvg: 200 },
        }

        const proportions = computeCurrentProportions(weeklySections)
        expect(proportions.Legs).toBeCloseTo(0.5)
        expect(proportions.Chest).toBeCloseTo(0.3)
        expect(proportions.Back).toBeCloseTo(0.2)
    })

    test('returns 0 proportion when total load is 0', () => {
        const weeklySections = {
            Legs: { currentWeekAvg: 0 },
            Chest: { currentWeekAvg: 0 },
        }
        const proportions = computeCurrentProportions(weeklySections)
        expect(proportions.Legs).toBe(0)
        expect(proportions.Chest).toBe(0)
    })
})

describe('computeTargetProportions', () => {
    test('normalizes target ratios so their sum equals 1.0', () => {
        const targets = {
            Legs: 2.0,
            Back: 1.0,
            Chest: 1.0,
        }

        const proportions = computeTargetProportions(targets)
        expect(proportions.Legs).toBeCloseTo(0.5) // 2 / 4
        expect(proportions.Back).toBeCloseTo(0.25) // 1 / 4
        expect(proportions.Chest).toBeCloseTo(0.25) // 1 / 4
    })
})

