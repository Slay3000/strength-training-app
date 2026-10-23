import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutFormRow from '../WorkoutFormRow'

describe('WorkoutFormRow Component', () => {
    test('renders Use Last chip when stats.last is available and fills fields on click', () => {
        const onChangeField = jest.fn()
        const stats = {
            last: { reps: 8, weight: 80 },
            max: { reps: 10, weight: 90 },
            delta: 5,
        }

        render(
            <WorkoutFormRow
                row={{ exerciseId: 'ex-1', reps: '', weight: '' }}
                searchTerm="Bench Press"
                onSearchTermChange={jest.fn()}
                isDropdownOpen={false}
                onToggleDropdown={jest.fn()}
                filteredDropdown={[]}
                onSelectExercise={jest.fn()}
                onChangeField={onChangeField}
                onRemoveRow={jest.fn()}
                canRemove={false}
                stats={stats}
            />,
        )

        const useLastBtn = screen.getByText(/⚡ Use Last/i)
        expect(useLastBtn).toBeInTheDocument()

        fireEvent.click(useLastBtn)
        expect(onChangeField).toHaveBeenCalledWith('reps', '8')
        expect(onChangeField).toHaveBeenCalledWith('weight', '80')
    })

    test('stepper buttons adjust reps and weight accurately', () => {
        const onChangeField = jest.fn()

        render(
            <WorkoutFormRow
                row={{ exerciseId: 'ex-1', reps: '10', weight: '80' }}
                searchTerm="Squat"
                onSearchTermChange={jest.fn()}
                isDropdownOpen={false}
                onToggleDropdown={jest.fn()}
                filteredDropdown={[]}
                onSelectExercise={jest.fn()}
                onChangeField={onChangeField}
                onRemoveRow={jest.fn()}
                canRemove={false}
                stats={{ last: null }}
            />,
        )

        // Click +1 rep
        fireEvent.click(screen.getByText('+1'))
        expect(onChangeField).toHaveBeenCalledWith('reps', '11')

        // Click +2.5 weight
        fireEvent.click(screen.getByText('+2.5'))
        expect(onChangeField).toHaveBeenCalledWith('weight', '82.5')

        // Click +5 weight
        fireEvent.click(screen.getByText('+5'))
        expect(onChangeField).toHaveBeenCalledWith('weight', '85')
    })
})

