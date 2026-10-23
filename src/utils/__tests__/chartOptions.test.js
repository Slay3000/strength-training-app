import {
    exerciseLineOptions,
    weeklyBarOptions,
    sectionBarOptions,
} from '../chartOptions'

describe('exerciseLineOptions', () => {
    test('provides dynamic suggestedMin and suggestedMax with padding when min !== max', () => {
        const options = exerciseLineOptions('Bench Press', [100, 150])
        // diff = 50, buffer = 50 * 0.15 = 7.5
        // suggestedMin = Math.floor(100 - 7.5) = 92
        // suggestedMax = Math.ceil(150 + 7.5) = 158
        expect(options.scales.y.suggestedMin).toBe(92)
        expect(options.scales.y.suggestedMax).toBe(158)
        expect(options.scales.y.beginAtZero).toBe(false)
        expect(options.plugins.title.text).toBe('Bench Press')
    })

    test('adds percentage buffer when min === max to avoid flat hairline graphs on mobile', () => {
        const options = exerciseLineOptions('Squat', [100, 100, 100])
        // suggestedMin = 100 * 0.8 - 1 = 79
        // suggestedMax = 100 * 1.2 + 1 = 121
        expect(options.scales.y.suggestedMin).toBe(79)
        expect(options.scales.y.suggestedMax).toBe(121)
    })

    test('handles empty data values gracefully without throwing', () => {
        const options = exerciseLineOptions('Empty Exercise', [])
        expect(options.scales.y.suggestedMin).toBeUndefined()
        expect(options.scales.y.suggestedMax).toBeUndefined()
    })

    test('supports custom y-axis titles like Est. 1RM (kg)', () => {
        const options = exerciseLineOptions('Deadlift', [200], 'Est. 1RM (kg)')
        expect(options.scales.y.title.text).toBe('Est. 1RM (kg)')
    })
})

describe('weeklyBarOptions and sectionBarOptions', () => {
    test('weeklyBarOptions applies suggestedMax and titles correctly', () => {
        const options = weeklyBarOptions('Weekly Comparison', 5000)
        expect(options.scales.y.suggestedMax).toBe(5000)
        expect(options.scales.y.beginAtZero).toBe(true)
        expect(options.plugins.title.text).toBe('Weekly Comparison')
        expect(options.responsive).toBe(true)
    })

    test('sectionBarOptions configures section scale titles and suggestedMax', () => {
        const options = sectionBarOptions(3000)
        expect(options.scales.y.suggestedMax).toBe(3000)
        expect(options.scales.x.title.text).toBe('Section')
        expect(options.scales.y.title.text).toBe('Load (kg)')
    })
})

