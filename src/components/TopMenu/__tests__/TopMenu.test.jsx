import { render, screen, fireEvent } from '@testing-library/react'
import TopMenu from '../TopMenu'

describe('TopMenu Component', () => {
    test('renders brand name and navigation items', () => {
        render(<TopMenu tab="current" setTab={jest.fn()} />)
        expect(screen.getByText('Workout App')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Current' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'History' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Summary' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Preferences' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Targets' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Add Exercise' })).toBeInTheDocument()
    })

    test('highlights the active tab with active class', () => {
        render(<TopMenu tab="summary" setTab={jest.fn()} />)
        const summaryBtn = screen.getByRole('button', { name: 'Summary' })
        const currentBtn = screen.getByRole('button', { name: 'Current' })

        expect(summaryBtn).toHaveClass('active')
        expect(currentBtn).not.toHaveClass('active')
    })

    test('calls setTab when a tab button is clicked', () => {
        const setTab = jest.fn()
        render(<TopMenu tab="current" setTab={setTab} />)

        fireEvent.click(screen.getByRole('button', { name: 'Targets' }))
        expect(setTab).toHaveBeenCalledWith('targets')

        fireEvent.click(screen.getByRole('button', { name: 'History' }))
        expect(setTab).toHaveBeenCalledWith('history')
    })

    test('toggles mobile menu open state when burger icon is clicked', () => {
        const { container } = render(<TopMenu tab="current" setTab={jest.fn()} />)
        const burgerBtn = screen.getByLabelText(/Toggle menu/i)
        const navMenu = container.querySelector('nav.menu')

        expect(navMenu).not.toHaveClass('open')
        fireEvent.click(burgerBtn)
        expect(navMenu).toHaveClass('open')
        fireEvent.click(burgerBtn)
        expect(navMenu).not.toHaveClass('open')
    })
})

