import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import * as authHook from './hooks/useAuth'
import * as workoutsService from './services/workoutsService'
import * as muscleTargetsService from './services/muscleTargetsService'
import * as exercisesService from './services/exercisesService'

jest.mock('./services/workoutsService')
jest.mock('./services/muscleTargetsService')
jest.mock('./services/exercisesService')

describe('App Component', () => {
    beforeEach(() => {
        workoutsService.fetchWorkouts.mockResolvedValue({ data: [] })
        muscleTargetsService.fetchMuscleTargets.mockResolvedValue({ data: [] })
        muscleTargetsService.saveMuscleTargets.mockResolvedValue({ data: [] })
        exercisesService.fetchExercises.mockResolvedValue({ data: [] })
        exercisesService.fetchExerciseTypes.mockResolvedValue({ data: [] })
    })

    test('renders loading screen initially while auth loads', () => {
        jest.spyOn(authHook, 'useAuth').mockReturnValue({
            userId: null,
            loading: true,
        })
        render(<App />)
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })

    test('renders login form when not authenticated', async () => {
        jest.spyOn(authHook, 'useAuth').mockReturnValue({
            userId: null,
            loading: false,
        })
        render(<App />)
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
        })
    })

    test('renders main app interface when user is authenticated', async () => {
        jest.spyOn(authHook, 'useAuth').mockReturnValue({
            userId: 'user-123',
            loading: false,
        })
        render(<App />)
        await waitFor(() => {
            expect(screen.getByText(/Workout App/i)).toBeInTheDocument()
            expect(screen.getByText(/No workouts yet/i)).toBeInTheDocument()
        })
        // Ensure default praise tip is not shown when no workouts exist
        expect(screen.queryByText(/Great balance last week/i)).not.toBeInTheDocument()
    })

    test('does not flash default praise tip on refresh before data loads', async () => {
        jest.spyOn(authHook, 'useAuth').mockReturnValue({
            userId: 'user-123',
            loading: false,
        })

        // Delay workouts response
        let resolveWorkouts
        workoutsService.fetchWorkouts.mockReturnValue(
            new Promise((resolve) => {
                resolveWorkouts = resolve
            }),
        )

        render(<App />)

        // While loading, loading indicator is shown and tips are not rendered
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
        expect(screen.queryByText(/Great balance last week/i)).not.toBeInTheDocument()

        // Resolve workouts
        resolveWorkouts({ data: [] })

        await waitFor(() => {
            expect(screen.getByText(/Workout App/i)).toBeInTheDocument()
        })
        expect(screen.queryByText(/Great balance last week/i)).not.toBeInTheDocument()
    })
})
