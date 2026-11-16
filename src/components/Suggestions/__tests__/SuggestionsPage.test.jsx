import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SuggestionsPage from '../SuggestionsPage'
import * as exercisesService from '../../../services/exercisesService'

jest.mock('../../../services/exercisesService')

describe('SuggestionsPage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('shows loading indicator initially', () => {
        exercisesService.fetchExercises.mockReturnValue(new Promise(() => {}))
        render(<SuggestionsPage workouts={[]} />)
        expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument()
    })

    test('shows empty message when no workouts or history exist', async () => {
        exercisesService.fetchExercises.mockResolvedValue({ data: [] })
        render(<SuggestionsPage workouts={[]} />)

        await waitFor(() => {
            expect(
                screen.getByText(/Not enough history yet/i),
            ).toBeInTheDocument()
        })
    })

    test('renders lagging sections and triggers onSelectExercise on chip click', async () => {
        const mockExercises = [
            { id: 1, name: 'Lat Pulldown', type: 'Back' },
            { id: 2, name: 'Barbell Row', type: 'Back' },
        ]
        exercisesService.fetchExercises.mockResolvedValue({
            data: mockExercises,
        })

        const now = new Date()
        const dayOfWeek = now.getDay()
        const diffToMonday = (dayOfWeek + 6) % 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - diffToMonday)
        monday.setHours(12, 0, 0, 0)

        const twoWeeksAgo = new Date(monday)
        twoWeeksAgo.setDate(monday.getDate() - 14)

        const workouts = [
            // 4-week historical volume for Back
            {
                exercise_id: 1,
                created_at: twoWeeksAgo.toISOString(),
                exercises: { type: 'Back', name: 'Lat Pulldown' },
                weight: 100,
                reps: 40,
            },
            // Current week (lower volume -> lagging)
            {
                exercise_id: 1,
                created_at: monday.toISOString(),
                exercises: { type: 'Back', name: 'Lat Pulldown' },
                weight: 100,
                reps: 2,
            },
        ]

        const handleSelect = jest.fn()

        render(
            <SuggestionsPage
                workouts={workouts}
                onSelectExercise={handleSelect}
            />,
        )

        await waitFor(() => {
            expect(screen.getByText(/Today's Suggestions/i)).toBeInTheDocument()
        })

        expect(screen.getByText('Back')).toBeInTheDocument()
        expect(screen.getByText(/−800 kg/i)).toBeInTheDocument()

        const chip = screen.getByText('Lat Pulldown')
        expect(chip).toBeInTheDocument()
        fireEvent.click(chip)

        expect(handleSelect).toHaveBeenCalledWith('Lat Pulldown')
    })

    test('renders both Recent and Haven-t done in a while sub-sections', async () => {
        const mockExercises = [
            { id: 1, name: 'Lat Pulldown', type: 'Back' },
            { id: 2, name: 'Barbell Row', type: 'Back' },
        ]
        exercisesService.fetchExercises.mockResolvedValue({
            data: mockExercises,
        })

        const now = new Date()
        const dayOfWeek = now.getDay()
        const diffToMonday = (dayOfWeek + 6) % 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - diffToMonday)
        monday.setHours(12, 0, 0, 0)

        const twoWeeksAgo = new Date(monday)
        twoWeeksAgo.setDate(monday.getDate() - 14)

        const workouts = [
            // Lat Pulldown was done 2 weeks ago and today
            {
                exercise_id: 1,
                created_at: twoWeeksAgo.toISOString(),
                exercises: { type: 'Back', name: 'Lat Pulldown' },
                weight: 100,
                reps: 40,
            },
            {
                exercise_id: 1,
                created_at: now.toISOString(),
                exercises: { type: 'Back', name: 'Lat Pulldown' },
                weight: 100,
                reps: 2,
            },
            // Barbell Row was NEVER done!
        ]

        render(<SuggestionsPage workouts={workouts} />)

        await waitFor(() => {
            expect(screen.getByText(/Today's Suggestions/i)).toBeInTheDocument()
        })

        // Should see recent subgroup with Lat Pulldown
        expect(screen.getByText(/Recent/i)).toBeInTheDocument()
        expect(screen.getByText('Lat Pulldown')).toBeInTheDocument()

        // Should see neglected subgroup with Barbell Row and 'Never' badge
        expect(screen.getByText(/Haven't done in a while/i)).toBeInTheDocument()
        expect(screen.getByText('Barbell Row')).toBeInTheDocument()
        expect(screen.getByText('Never')).toBeInTheDocument()
    })
})
