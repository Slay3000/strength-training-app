import {
    computeRecoveryScores,
    computeSectionRecoveryScore,
    getLabelAndColorForScore,
} from '../recoveryScore'
import { WorkoutDay, WorkoutWeek } from '../../models/workoutModels'

describe('getLabelAndColorForScore', () => {
    test('maps score ranges to correct labels and colors', () => {
        expect(getLabelAndColorForScore(99).label).toBe('Elite')
        expect(getLabelAndColorForScore(92).label).toBe('Excellent')
        expect(getLabelAndColorForScore(80).label).toBe('Good')
        expect(getLabelAndColorForScore(65).label).toBe('Moderate')
        expect(getLabelAndColorForScore(45).label).toBe('Strained')
        expect(getLabelAndColorForScore(25).label).toBe('High Risk')
        expect(getLabelAndColorForScore(10).label).toBe('Critical')
    })
})

describe('computeSectionRecoveryScore', () => {
    test('returns No Activity when both current and best are 0', () => {
        const result = computeSectionRecoveryScore(0, 0, 0)
        expect(result.label).toBe('No Activity')
        expect(result.score).toBe(100)
        expect(result.color).toBe('#9e9e9e')
    })

    test('returns Fresh when section was trained previously but rested this week', () => {
        const result = computeSectionRecoveryScore(0, 3000, 0)
        expect(result.label).toBe('Fresh')
        expect(result.score).toBe(100)
        expect(result.color).toBe('#4caf50')
        expect(result.bestLoad).toBe(3000)
    })

    test('gives high score for deload volume (50% of best week)', () => {
        const result = computeSectionRecoveryScore(1500, 3000, 1)
        expect(result.score).toBe(95)
        expect(result.label).toBe('Excellent')
        expect(result.loadRatio).toBe(0.5)
    })

    test('scales score smoothly as load approaches best week', () => {
        const at80Percent = computeSectionRecoveryScore(2400, 3000, 2)
        expect(at80Percent.score).toBe(77)
        expect(at80Percent.label).toBe('Good')

        const at100Percent = computeSectionRecoveryScore(3000, 3000, 2)
        expect(at100Percent.score).toBe(65)
        expect(at100Percent.label).toBe('Moderate')
    })

    test('penalizes overreaching beyond historical best week', () => {
        const overreaching = computeSectionRecoveryScore(3900, 3000, 2) // 130%
        expect(overreaching.score).toBeLessThan(50)
        expect(['Strained', 'High Risk', 'Critical']).toContain(overreaching.label)
    })

    test('applies frequency penalty for 3 or more days in the week', () => {
        const twoDays = computeSectionRecoveryScore(2000, 3000, 2)
        const fourDays = computeSectionRecoveryScore(2000, 3000, 4)
        expect(fourDays.score).toBeLessThan(twoDays.score)
    })
})

describe('computeRecoveryScores', () => {
    test('returns score 100 and Fresh when allDays is empty', () => {
        const result = computeRecoveryScores([], [], {}, {}, [])
        expect(result.overall).toEqual({
            score: 100,
            label: 'Fresh',
            color: '#4caf50',
        })
        expect(result.sections).toEqual({})
    })

    test('returns No Activity status when there is zero workout load', () => {
        const days = [new WorkoutDay('2026-10-23', [])]
        const currentWeek = new WorkoutWeek(new Date('2026-10-19'), [])
        const previousWeek = new WorkoutWeek(new Date('2026-10-12'), [])

        const result = computeRecoveryScores(
            days,
            days,
            currentWeek,
            previousWeek,
            ['Chest'],
        )

        expect(result.overall.label).toBe('No Activity')
        expect(result.sections.Chest.label).toBe('No Activity')
    })

    test('benchmarks section recovery against bestSectionLoads even if previous week was 0', () => {
        // Last week had 0 chest workouts
        const lastWeekWorkouts = []
        // This week user did 2,400 kg Chest
        const thisWeekWorkouts = [
            {
                created_at: '2026-10-21T10:00:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 80,
                reps: 10,
            },
            {
                created_at: '2026-10-21T10:05:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 80,
                reps: 10,
            },
            {
                created_at: '2026-10-21T10:10:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 80,
                reps: 10, // 2400 load total
            },
        ]

        const allDays = [
            new WorkoutDay('2026-10-14', lastWeekWorkouts),
            new WorkoutDay('2026-10-21', thisWeekWorkouts),
        ]
        const thisWeekDays = [new WorkoutDay('2026-10-21', thisWeekWorkouts)]
        const currentWeek = new WorkoutWeek(new Date('2026-10-19'), thisWeekWorkouts)
        const previousWeek = new WorkoutWeek(new Date('2026-10-12'), lastWeekWorkouts)

        // Best week historically was 3,000 kg
        const bestSectionLoads = { Chest: 3000 }
        const bestOverallWeekLoad = 3000

        const result = computeRecoveryScores(
            allDays,
            thisWeekDays,
            currentWeek,
            previousWeek,
            ['Chest'],
            bestSectionLoads,
            bestOverallWeekLoad,
        )

        // 2400 / 3000 = 80% of best week. Should NOT be marked Critical!
        expect(result.sections.Chest.bestLoad).toBe(3000)
        expect(result.sections.Chest.currentLoad).toBe(2400)
        expect(result.sections.Chest.score).toBe(77)
        expect(result.sections.Chest.label).toBe('Good')
    })

    test('calculates high recovery score when current load is lower than previous (deload)', () => {
        const lastWeekWorkouts = [
            {
                created_at: '2026-10-14T10:00:00Z',
                exercises: { type: 'Legs', name: 'Squat' },
                weight: 100,
                reps: 20, // 2000 load
            },
        ]
        const thisWeekWorkouts = [
            {
                created_at: '2026-10-21T10:00:00Z',
                exercises: { type: 'Legs', name: 'Squat' },
                weight: 100,
                reps: 10, // 1000 load (deloading)
            },
        ]

        const allDays = [
            new WorkoutDay('2026-10-14', lastWeekWorkouts),
            new WorkoutDay('2026-10-21', thisWeekWorkouts),
        ]
        const thisWeekDays = [new WorkoutDay('2026-10-21', thisWeekWorkouts)]
        const currentWeek = new WorkoutWeek(new Date('2026-10-19'), thisWeekWorkouts)
        const previousWeek = new WorkoutWeek(new Date('2026-10-12'), lastWeekWorkouts)

        const result = computeRecoveryScores(
            allDays,
            thisWeekDays,
            currentWeek,
            previousWeek,
            ['Legs'],
        )

        expect(result.overall.score).toBeGreaterThanOrEqual(95)
        expect(['Elite', 'Excellent']).toContain(result.overall.label)
    })

    test('penalizes massive volume jumps appropriately', () => {
        const lastWeekWorkouts = [
            {
                created_at: '2026-10-14T10:00:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 50,
                reps: 5, // 250 load
            },
        ]
        const thisWeekWorkouts = [
            {
                created_at: '2026-10-20T10:00:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 120,
                reps: 10, // 1200 load
            },
            {
                created_at: '2026-10-21T10:00:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 120,
                reps: 10, // 1200 load
            },
            {
                created_at: '2026-10-22T10:00:00Z',
                exercises: { type: 'Chest', name: 'Bench' },
                weight: 120,
                reps: 10, // 1200 load (frequency 3+ days and massive jump)
            },
        ]

        const allDays = [
            new WorkoutDay('2026-10-14', lastWeekWorkouts),
            new WorkoutDay('2026-10-20', [thisWeekWorkouts[0]]),
            new WorkoutDay('2026-10-21', [thisWeekWorkouts[1]]),
            new WorkoutDay('2026-10-22', [thisWeekWorkouts[2]]),
        ]
        const thisWeekDays = allDays.slice(1)
        const currentWeek = new WorkoutWeek(new Date('2026-10-19'), thisWeekWorkouts)
        const previousWeek = new WorkoutWeek(new Date('2026-10-12'), lastWeekWorkouts)

        const result = computeRecoveryScores(
            allDays,
            thisWeekDays,
            currentWeek,
            previousWeek,
            ['Chest'],
        )

        // Score should drop significantly due to high volume jump & frequency
        expect(result.overall.score).toBeLessThan(70)
        expect(['Strained', 'High Risk', 'Critical', 'Moderate']).toContain(
            result.overall.label,
        )
    })
})

