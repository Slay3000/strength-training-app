import { useState } from 'react'
import './TopMenu.css'

export default function TopMenu({ tab, setTab }) {
    const [open, setOpen] = useState(false)

    const handleSelect = (value) => {
        setTab(value)
        setOpen(false) // close menu
    }

    return (
        <header className="topmenu">
            <div className="topmenu-brand">Workout App</div>

            {/* Burger icon */}
            <button
                className={`burger ${open ? 'open' : ''}`}
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
            >
                <span />
                <span />
                <span />
            </button>

            {/* Menu */}
            <nav className={`menu ${open ? 'open' : ''}`}>
                <button
                    className={tab === 'current' ? 'active' : ''}
                    onClick={() => handleSelect('current')}
                >
                    Current
                </button>

                <button
                    className={tab === 'history' ? 'active' : ''}
                    onClick={() => handleSelect('history')}
                >
                    History
                </button>

                <button
                    className={tab === 'summary' ? 'active' : ''}
                    onClick={() => handleSelect('summary')}
                >
                    Summary
                </button>

                <button
                    className={tab === 'preferences' ? 'active' : ''}
                    onClick={() => handleSelect('preferences')}
                >
                    Preferences
                </button>

                <button
                    className={tab === 'targets' ? 'active' : ''}
                    onClick={() => handleSelect('targets')}
                >
                    Targets
                </button>

                <button
                    className={tab === 'add-exercise' ? 'active' : ''}
                    onClick={() => handleSelect('add-exercise')}
                >
                    Add Exercise
                </button>
            </nav>
        </header>
    )
}
