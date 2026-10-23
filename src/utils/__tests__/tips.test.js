import {
    getLastWeekTip,
    getThisWeekTip,
    computeTrainingTips,
} from '../tips'

describe('getLastWeekTip and getThisWeekTip', () => {
    test('returns praise message when no muscle is undertrained', () => {
        expect(getLastWeekTip([])).toContain('Great balance last week')
        expect(getThisWeekTip([])).toContain('well balanced so far')
    })

    test('specifies the single undertrained muscle', () => {
        const undertrained = [{ muscle: 'Legs', diffPercent: -0.15 }]
        expect(getLastWeekTip(undertrained)).toContain('lacked focus on Legs')
        expect(getThisWeekTip(undertrained)).toContain('undertrained Legs so far')
    })

    test('lists multiple undertrained muscles separated by comma', () => {
        const undertrained = [
            { muscle: 'Back', diffPercent: -0.12 },
            { muscle: 'Chest', diffPercent: -0.08 },
        ]
        expect(getLastWeekTip(undertrained)).toContain('Back, Chest')
        expect(getThisWeekTip(undertrained)).toContain('Back, Chest')
    })
})

describe('computeTrainingTips', () => {
    test('detects undertrained sections based on target vs actual proportion difference < -0.05', () => {
        const weeklyAverages = {
            sections: {
                Legs: { previousWeekAvg: 100, currentWeekAvg: 200 },
                Chest: { previousWeekAvg: 900, currentWeekAvg: 800 },
            },
        }
        // Target is 50% Legs, 50% Chest
        const targetProportions = { Legs: 0.5, Chest: 0.5 }
        // Current: Legs = 200/1000 = 0.20 (diff: 0.20 - 0.50 = -0.30) -> undertrained!
        const currentProportions = { Legs: 0.2, Chest: 0.8 }

        const result = computeTrainingTips({
            weeklyAverages,
            targetProportions,
            currentProportions,
            todayLoad: 500,
        })

        expect(result.workoutTip).toContain('Legs')
        expect(result.thisWeekTip).toContain('Legs')
        expect(result.hideThisWeekTip).toBe(false)
    })

    test('sets hideThisWeekTip to true if current week total matches today load (first workout of week)', () => {
        const weeklyAverages = {
            sections: {
                Legs: { currentWeekAvg: 300, previousWeekAvg: 500 },
            },
        }
        const targetProportions = { Legs: 1.0 }
        const currentProportions = { Legs: 1.0 }

        const result = computeTrainingTips({
            weeklyAverages,
            targetProportions,
            currentProportions,
            todayLoad: 300, // exact match
        })

        expect(result.hideThisWeekTip).toBe(true)
    })
})

