import { render, screen } from '@testing-library/react'
import PRStatsBox from '../PRStatsBox'

describe('PRStatsBox Component', () => {
    test('renders all PR stats correctly', () => {
        render(
            <PRStatsBox
                exercisePR={2000}
                setPR={120}
                todayLoad={1500}
                progress={75.0}
                remaining={450}
                totalReps={25}
                bestSet={1200}
            />,
        )

        expect(screen.getByText(/Exercise PR:/i)).toBeInTheDocument()
        expect(screen.getByText(/2,000 kg/i)).toBeInTheDocument()
        expect(screen.getByText(/Set PR:/i)).toBeInTheDocument()
        expect(screen.getByText(/120 kg/i)).toBeInTheDocument()
        expect(screen.getByText(/Today Load:/i)).toBeInTheDocument()
        expect(screen.getByText(/1,500 kg/i)).toBeInTheDocument()
        expect(screen.getByText(/Progress:/i)).toBeInTheDocument()
        expect(screen.getByText(/75.0 %/i)).toBeInTheDocument()
        expect(screen.getByText(/To PR:/i)).toBeInTheDocument()
        expect(screen.getByText(/450 kg/i)).toBeInTheDocument()
        expect(screen.getByText(/Total Reps:/i)).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText(/Best Set:/i)).toBeInTheDocument()
        expect(screen.getByText(/1200 kg·rep/i)).toBeInTheDocument()
    })

    test('applies progress-new-pr class when progress exceeds 100%', () => {
        const { container } = render(
            <PRStatsBox
                exercisePR={1000}
                setPR={100}
                todayLoad={1200}
                progress={120.0}
                remaining={-200}
                totalReps={20}
                bestSet={1000}
            />,
        )

        expect(container.querySelector('.progress-new-pr')).toBeInTheDocument()
        expect(container.querySelector('.remaining-hit-pr')).toBeInTheDocument()
    })
})

