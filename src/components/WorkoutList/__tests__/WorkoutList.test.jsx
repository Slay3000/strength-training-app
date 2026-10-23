import { groupWorkouts } from '../WorkoutList'
import { render, screen } from '@testing-library/react'
import TodaySummaryBar from '../TodaySummaryBar'
import ExerciseCard from '../ExerciseCard'

describe('groupWorkouts', () => {
    test('groups workouts by date -> type -> exercise name', () => {
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
                reps: 5,
            },
            {
                id: 3,
                created_at: '2026-10-23T10:15:00Z',
                exercises: { type: 'Arms', name: 'Bicep Curl' },
                weight: 20,
                reps: 12,
            },
            {
                id: 4,
                created_at: '2026-10-22T10:00:00Z',
                exercises: { type: 'Legs', name: 'Squat' },
                weight: 140,
                reps: 5,
            },
        ]

        const grouped = groupWorkouts(workouts)

        expect(grouped['2026-10-23']['Chest']['Bench Press']).toHaveLength(2)
        expect(grouped['2026-10-23']['Arms']['Bicep Curl']).toHaveLength(1)
        expect(grouped['2026-10-22']['Legs']['Squat']).toHaveLength(1)
    })

    test('defaults missing types and names to Unknown and Unknown Exercise', () => {
        const workouts = [
            {
                id: 1,
                ymd: '2026-10-20',
                exercises: null,
            },
        ]
        const grouped = groupWorkouts(workouts)
        expect(grouped['2026-10-20']['Unknown']['Unknown Exercise']).toHaveLength(1)
    })
})

describe('TodaySummaryBar Component', () => {
    test('renders today load, last week average, and progress bar', () => {
        render(
            <TodaySummaryBar
                todayLoad={1200}
                prevWeekAvg={1500}
                toGoToday={300}
            />,
        )

        expect(screen.getByText(/Today Load:/i)).toBeInTheDocument()
        expect(screen.getByText(/Last Week Avg:/i)).toBeInTheDocument()
        expect(screen.getByText(/Daily Target Progress/i)).toBeInTheDocument()
        expect(screen.getByText(/80%/i)).toBeInTheDocument()
        expect(screen.getByText(/300 kg/i)).toBeInTheDocument()
    })

    test('shows Beat Last Week and positive badge when daily target is exceeded', () => {
        const { container } = render(
            <TodaySummaryBar
                todayLoad={1800}
                prevWeekAvg={1500}
                toGoToday={-300}
            />,
        )

        expect(screen.getByText(/🔥 Beat Last Week!/i)).toBeInTheDocument()
        expect(screen.getByText(/\+300 kg/i)).toBeInTheDocument()
        expect(container.querySelector('.goal-reached')).toBeInTheDocument()
        expect(container.querySelector('.positive')).toBeInTheDocument()
    })
})

describe('ExerciseCard Component', () => {
    test('renders numbered sets and badges', () => {
        const sets = [
            { id: 1, reps: 10, weight: 80, exercise_id: 'ex-1' },
            { id: 2, reps: 8, weight: 100, exercise_id: 'ex-1' },
        ]
        const workouts = [
            { id: 10, exercise_id: 'ex-1', weight: 90, reps: 5, created_at: '2026-10-01' },
        ]

        render(
            <ExerciseCard
                name="Bench Press"
                sets={sets}
                exKey="2026-10-23-Chest-Bench Press"
                workouts={workouts}
                hideDate={true}
                openPR={{}}
                setOpenPR={jest.fn()}
                collapsed={false}
                onToggle={jest.fn()}
            />,
        )

        expect(screen.getByText('Set 1')).toBeInTheDocument()
        expect(screen.getByText('Set 2')).toBeInTheDocument()
        // Set 2 has weight 100, which beats previous max of 90 -> New PR!
        expect(screen.getByText(/🏆 PR/i)).toBeInTheDocument()
    })

    test('badge bug regression: 4 sets of same weight do NOT all get PR badges', () => {
        const fourSets = [
            { id: 1, reps: 11, weight: 20, exercise_id: 'ex-2', created_at: '2026-10-23T10:00:00Z' },
            { id: 2, reps: 15, weight: 20, exercise_id: 'ex-2', created_at: '2026-10-23T10:05:00Z' }, // best set
            { id: 3, reps: 11, weight: 20, exercise_id: 'ex-2', created_at: '2026-10-23T10:10:00Z' },
            { id: 4, reps: 14, weight: 20, exercise_id: 'ex-2', created_at: '2026-10-23T10:15:00Z' },
        ]
        const priorWorkouts = [
            { id: 99, exercise_id: 'ex-2', weight: 15, reps: 10, created_at: '2026-10-01T10:00:00Z' },
        ]

        render(
            <ExerciseCard
                name="Dumbbell Curl"
                sets={fourSets}
                exKey="2026-10-23-Arms-Dumbbell Curl"
                workouts={[...priorWorkouts, ...fourSets]}
                hideDate={true}
                openPR={{}}
                setOpenPR={jest.fn()}
                collapsed={false}
                onToggle={jest.fn()}
            />,
        )

        // All 4 sets must be rendered with set numbers
        expect(screen.getByText('Set 1')).toBeInTheDocument()
        expect(screen.getByText('Set 2')).toBeInTheDocument()
        expect(screen.getByText('Set 3')).toBeInTheDocument()
        expect(screen.getByText('Set 4')).toBeInTheDocument()

        // Only ONE PR badge should appear across all 4 sets (on Set 2)
        const prBadges = screen.getAllByText(/🏆 PR/i)
        expect(prBadges).toHaveLength(1)
    })

    test('no PR badge is rendered if current sets do not beat prior max', () => {
        const fourSets = [
            { id: 1, reps: 11, weight: 20, exercise_id: 'ex-3', created_at: '2026-10-23T10:00:00Z' },
            { id: 2, reps: 15, weight: 20, exercise_id: 'ex-3', created_at: '2026-10-23T10:05:00Z' },
            { id: 3, reps: 11, weight: 20, exercise_id: 'ex-3', created_at: '2026-10-23T10:10:00Z' },
            { id: 4, reps: 14, weight: 20, exercise_id: 'ex-3', created_at: '2026-10-23T10:15:00Z' },
        ]
        const priorWorkouts = [
            { id: 99, exercise_id: 'ex-3', weight: 20, reps: 15, created_at: '2026-10-01T10:00:00Z' },
        ]

        render(
            <ExerciseCard
                name="Dumbbell Curl"
                sets={fourSets}
                exKey="2026-10-23-Arms-Dumbbell Curl"
                workouts={[...priorWorkouts, ...fourSets]}
                hideDate={true}
                openPR={{}}
                setOpenPR={jest.fn()}
                collapsed={false}
                onToggle={jest.fn()}
            />,
        )

        expect(screen.queryByText(/🏆 PR/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/🏆 1RM PR/i)).not.toBeInTheDocument()
    })

    test('no PR badge is rendered on initial workout for an exercise', () => {
        const initialSets = [
            { id: 1, reps: 10, weight: 20, exercise_id: 'ex-4', created_at: '2026-10-23T10:00:00Z' },
            { id: 2, reps: 10, weight: 20, exercise_id: 'ex-4', created_at: '2026-10-23T10:05:00Z' },
        ]

        render(
            <ExerciseCard
                name="Tricep Extension"
                sets={initialSets}
                exKey="2026-10-23-Arms-Tricep Extension"
                workouts={[...initialSets]}
                hideDate={true}
                openPR={{}}
                setOpenPR={jest.fn()}
                collapsed={false}
                onToggle={jest.fn()}
            />,
        )

        expect(screen.queryByText(/🏆 PR/i)).not.toBeInTheDocument()
    })
})
