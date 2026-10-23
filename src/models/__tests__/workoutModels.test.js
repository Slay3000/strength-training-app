import { WorkoutDay, WorkoutWeek } from '../workoutModels'

describe('WorkoutDay Model', () => {
    const workouts = [
        {
            id: 1,
            created_at: '2026-10-23T10:00:00Z',
            exercises: { type: 'Chest', name: 'Bench Press' },
            weight: 100,
            reps: 5,
        },
        {
            id: 2,
            created_at: '2026-10-23T10:05:00Z',
            exercises: { type: 'Chest', name: 'Bench Press' },
            weight: 100,
            reps: 8,
        },
        {
            id: 3,
            created_at: '2026-10-23T10:15:00Z',
            exercises: { type: 'Arms', name: 'Bicep Curl' },
            weight: 25,
            reps: 10,
        },
    ]

    test('correctly calculates total load and best set', () => {
        const day = new WorkoutDay('2026-10-23', workouts)
        // 100*5 (500) + 100*8 (800) + 25*10 (250) = 1550
        expect(day.getTotalWeight()).toBe(1550)
        // Best set is 100*8 = 800
        expect(day.getBestSet()).toBe(800)
    })

    test('retrieves specific sections and exercises', () => {
        const day = new WorkoutDay('2026-10-23', workouts)
        expect(day.getSection('Chest')['Bench Press']).toHaveLength(2)
        expect(day.getExercise('Arms', 'Bicep Curl')).toHaveLength(1)
        expect(day.getSection('NonExistent')).toEqual({})
    })

    test('compareTo computes delta between two WorkoutDay instances', () => {
        const prevDay = new WorkoutDay('2026-10-20', [
            {
                created_at: '2026-10-20',
                exercises: { type: 'Chest', name: 'Bench Press' },
                weight: 100,
                reps: 10, // 1000 load
            },
        ])

        const currDay = new WorkoutDay('2026-10-23', [
            {
                created_at: '2026-10-23',
                exercises: { type: 'Chest', name: 'Bench Press' },
                weight: 100,
                reps: 12, // 1200 load
            },
        ])

        const comparison = prevDay.compareTo(currDay)
        expect(comparison.overall.prevTotalWeight).toBe(1000)
        expect(comparison.overall.currentTotalWeight).toBe(1200)
        expect(comparison.overall.loadToGo).toBe(-200) // exceeded by 200
        expect(comparison.sections.Chest.exercises['Bench Press'].loadToGo).toBe(-200)
    })
})

describe('WorkoutWeek Model', () => {
    test('calculates average load per active day', () => {
        const workouts = [
            { created_at: '2026-10-20T10:00:00Z', weight: 100, reps: 10 }, // 1000
            { created_at: '2026-10-22T10:00:00Z', weight: 100, reps: 10 }, // 1000
        ]
        const week = new WorkoutWeek(new Date('2026-10-19'), workouts)
        expect(week.getDaysCount()).toBe(2)
        expect(week.totalLoad).toBe(2000)
        expect(week.avgLoadPerDay).toBe(1000)
    })

    test('handles empty workouts without division by zero', () => {
        const emptyWeek = new WorkoutWeek(new Date('2026-10-19'), [])
        expect(emptyWeek.totalLoad).toBe(0)
        expect(emptyWeek.getDaysCount()).toBe(1)
        expect(emptyWeek.avgLoadPerDay).toBe(0)
    })
})

