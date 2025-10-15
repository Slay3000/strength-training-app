import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import './WorkoutForm.css'

export default function WorkoutForm({
    exerciseId,
    setExerciseId,
    reps,
    setReps,
    weight,
    setWeight,
    onAdd,
    hiddenExercises = [],
}) {
    const [exercises, setExercises] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const containerRef = useRef(null)

    // Fetch exercises
    useEffect(() => {
        async function fetchExercises() {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('type', { ascending: true })
                .order('name', { ascending: true })

            if (error) console.error(error)
            else setExercises(data || [])
        }
        fetchExercises()
    }, [])

    // When exerciseId changes (e.g. editing), show its name in search input
    useEffect(() => {
        if (!exerciseId) return
        const ex = exercises.find((e) => e.id === exerciseId)
        if (ex) setSearchTerm(ex.name)
    }, [exerciseId, exercises])

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter visible exercises by search and hidden list
    const visible = exercises
        .filter((ex) => !hiddenExercises.includes(ex.id))
        .filter((ex) =>
            searchTerm.trim()
                ? ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ex.type.toLowerCase().includes(searchTerm.toLowerCase())
                : true
        )

    // Group by type
    const grouped = visible.reduce((acc, ex) => {
        if (!acc[ex.type]) acc[ex.type] = []
        acc[ex.type].push(ex)
        return acc
    }, {})

    const repsOptions = [5, 8, 10, 12, 15, 20, 25, 30]
    const weightOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]

    function handleSelectExercise(ex) {
        setExerciseId(ex.id)
        setSearchTerm(ex.name)
        setDropdownOpen(false)
    }

    return (
        <div className="workout-form" ref={containerRef}>
            {/* Exercise input + grouped dropdown */}
            <div className="exercise-select-container">
                <input
                    type="text"
                    className="exercise-input"
                    placeholder="Search or select exercise..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
                />

                {dropdownOpen && (
                    <div className="dropdown-list">
                        {Object.keys(grouped).length === 0 && (
                            <div className="dropdown-empty">No exercises</div>
                        )}

                        {Object.entries(grouped).map(([type, exs]) => (
                            <div key={type} className="dropdown-group">
                                <div className="dropdown-type">{type}</div>
                                {exs.map((ex) => (
                                    <div
                                        key={ex.id}
                                        className={
                                            'dropdown-item' +
                                            (ex.id === exerciseId
                                                ? ' selected'
                                                : '')
                                        }
                                        onClick={() => handleSelectExercise(ex)}
                                    >
                                        {ex.name}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reps input with datalist (predefined but editable) */}
            <input
                type="number"
                list="reps-options"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="reps-input"
                placeholder="Reps"
            />
            <datalist id="reps-options">
                {repsOptions.map((r) => (
                    <option key={r} value={r} />
                ))}
            </datalist>

            {/* Weight input with datalist */}
            <input
                type="number"
                list="weight-options"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="weight-input"
                placeholder="Weight (kg)"
            />
            <datalist id="weight-options">
                {weightOptions.map((w) => (
                    <option key={w} value={w} />
                ))}
            </datalist>

            <button onClick={onAdd} className="add-button">
                Add
            </button>
        </div>
    )
}
