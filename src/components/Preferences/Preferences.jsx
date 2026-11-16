import { useEffect, useState, useRef } from 'react'
import { fetchExercises } from '../../services/exercisesService'
import './Preferences.css'

export default function Preferences({ hiddenExercises, setHiddenExercises, onBodyweightChange }) {
    const [exercises, setExercises] = useState([])
    const [openType, setOpenType] = useState(null) // which type's dropdown is open
    const dropdownRef = useRef(null)

    const [bodyweight, setBodyweight] = useState(
        () => localStorage.getItem('bodyweight_kg') || '',
    )

    useEffect(() => {
        async function loadExercises() {
            const { data, error } = await fetchExercises()
            if (error) console.error(error)
            else setExercises(data || [])
        }
        loadExercises()
    }, [])

    const toggleExercise = (id) => {
        if (hiddenExercises.includes(id)) {
            setHiddenExercises(hiddenExercises.filter((e) => e !== id))
        } else {
            setHiddenExercises([...hiddenExercises, id])
        }
    }

    // Group exercises by type
    const grouped = exercises.reduce((acc, ex) => {
        if (!acc[ex.type]) acc[ex.type] = []
        acc[ex.type].push(ex)
        return acc
    }, {})

    // Close dropdown when clicked outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpenType(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleBodyweightChange(e) {
        const val = e.target.value
        setBodyweight(val)
        if (val) {
            localStorage.setItem('bodyweight_kg', val)
        } else {
            localStorage.removeItem('bodyweight_kg')
        }
        if (onBodyweightChange) onBodyweightChange(val)
    }

    return (
        <div className="preferences-container">
            <div className="preference-row" style={{ marginBottom: '16px' }}>
                <label htmlFor="bodyweight-input" style={{ fontWeight: 600, marginRight: '8px' }}>
                    Bodyweight (kg):
                </label>
                <input
                    id="bodyweight-input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={bodyweight}
                    onChange={handleBodyweightChange}
                    placeholder="e.g. 80"
                    style={{ width: '100px' }}
                />
            </div>

            {Object.entries(grouped).map(([type, exs]) => (
                <div
                    key={type}
                    className="exercise-type-dropdown"
                    ref={dropdownRef}
                >
                    <button
                        className="dropdown-toggle"
                        onClick={() =>
                            setOpenType(openType === type ? null : type)
                        }
                    >
                        {type}
                    </button>

                    {openType === type && (
                        <div className="dropdown-menu">
                            {exs.map((ex) => (
                                <label key={ex.id} className="dropdown-item">
                                    <input
                                        type="checkbox"
                                        checked={
                                            !hiddenExercises.includes(ex.id)
                                        }
                                        onChange={() => toggleExercise(ex.id)}
                                    />
                                    {ex.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
