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

    // Fetch exercises once
    useEffect(() => {
        async function fetchExercises() {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('type', { ascending: true })
                .order('name', { ascending: true })

            if (error) {
                console.error('Error fetching exercises:', error)
                setExercises([])
            } else {
                setExercises(data || [])
            }
        }
        fetchExercises()
    }, [])

    // Set search term to the selected exercise's name
    useEffect(() => {
        if (!exerciseId) return
        const selected = exercises.find((e) => e.id === exerciseId)
        if (selected) setSearchTerm(selected.name)
    }, [exerciseId, exercises])

    // Close dropdown when clicking outside
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

    // Filter visible exercises
    const visibleExercises = exercises
        .filter((ex) => !hiddenExercises.includes(ex.id))
        .filter((ex) => {
            const term = searchTerm.trim().toLowerCase()
            if (!term) return true
            return (
                ex.name.toLowerCase().includes(term) ||
                (ex.type || '').toLowerCase().includes(term)
            )
        })

    // Group by type (section)
    const groupedExercises = visibleExercises.reduce((acc, ex) => {
        const type = ex.type || 'Other'
        if (!acc[type]) acc[type] = []
        acc[type].push(ex)
        return acc
    }, {})

    // Preset common inputs
    const repsOptions = [5, 8, 10, 12, 15, 20, 25, 30]
    const weightOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]

    // Select exercise handler
    function handleSelectExercise(ex) {
        setExerciseId(ex.id)
        setSearchTerm(ex.name)
        setDropdownOpen(false)
    }

    // Add workout handler — validation
    function handleAddClick() {
        if (!exerciseId) {
            alert('Please select an exercise.')
            return
        }
        if (!reps || !weight) {
            alert('Please enter reps and weight.')
            return
        }
        onAdd()
        setReps('')
        setWeight('')
    }

    return (
        <div className="workout-form" ref={containerRef}>
            {/* Exercise selector */}
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
                        {Object.keys(groupedExercises).length === 0 ? (
                            <div className="dropdown-empty">
                                No exercises found
                            </div>
                        ) : (
                            Object.entries(groupedExercises).map(
                                ([type, list]) => (
                                    <div key={type} className="dropdown-group">
                                        <div className="dropdown-type">
                                            {type}
                                        </div>
                                        {list.map((ex) => (
                                            <div
                                                key={ex.id}
                                                className={`dropdown-item${
                                                    ex.id === exerciseId
                                                        ? ' selected'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    handleSelectExercise(ex)
                                                }
                                            >
                                                {ex.name}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Reps input */}
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

            {/* Weight input */}
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

            <button onClick={handleAddClick} className="add-button">
                Add
            </button>
        </div>
    )
}
