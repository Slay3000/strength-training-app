import { calculate1RM } from '../fitnessCalc'

describe('calculate1RM', () => {
    test('returns 0 for non-positive weight or reps', () => {
        expect(calculate1RM(0, 10)).toBe(0)
        expect(calculate1RM(100, 0)).toBe(0)
        expect(calculate1RM(-50, 5)).toBe(0)
        expect(calculate1RM(100, -2)).toBe(0)
        expect(calculate1RM(null, undefined)).toBe(0)
    })

    test('returns exact weight for 1 rep', () => {
        expect(calculate1RM(100, 1)).toBe(100)
        expect(calculate1RM(75.5, 1)).toBe(75.5)
    })

    test('computes estimated 1RM using Brzycki formula: weight * (1 + reps/30)', () => {
        // 100 * (1 + 10/30) = 133.33... -> Math.round -> 133
        expect(calculate1RM(100, 10)).toBe(133)
        // 60 * (1 + 5/30) = 60 * 1.1666... = 70
        expect(calculate1RM(60, 5)).toBe(70)
    })

    test('handles numeric strings gracefully', () => {
        expect(calculate1RM('100', '10')).toBe(133)
        expect(calculate1RM('80', '1')).toBe(80)
    })
})

