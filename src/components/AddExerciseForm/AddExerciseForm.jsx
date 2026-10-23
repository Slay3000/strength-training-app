import { useState, useEffect } from 'react'
import {
    fetchExerciseTypes,
    insertExercise,
} from '../../services/exercisesService'
import './AddExerciseForm.css'

export default function AddExerciseForm() {
    const [name, setName] = useState('')
    const [type, setType] = useState('')
    const [types, setTypes] = useState([])
    const [errorMessage, setErrorMessage] = useState('')

    // Helper to capitalize first letter of each word
    function capitalizeWords(str) {
        return str
            .trim()
            .split(' ')
            .filter(Boolean)
            .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    // Fetch existing types from exercises table
    useEffect(() => {
        async function loadTypes() {
            const { data, error } = await fetchExerciseTypes()
            if (error) console.error(error)
            else {
                const uniqueTypes = [
                    ...new Set(data.map((d) => d.type).filter(Boolean)),
                ]
                setTypes(uniqueTypes)
            }
        }
        loadTypes()
    }, [])

    async function handleAddExercise() {
        setErrorMessage('')
        if (!name || !type) {
            setErrorMessage('Please provide both exercise name and type.')
            return
        }

        const normalizedName = capitalizeWords(name)
        const normalizedType = capitalizeWords(type)

        const { error } = await insertExercise({
            name: normalizedName,
            type: normalizedType,
        })

        if (error) {
            if (error.code === '23505') {
                // unique_violation
                setErrorMessage(`Exercise "${normalizedName}" already exists.`)
            } else {
                setErrorMessage(
                    'Failed to add exercise. See console for details.',
                )
                console.error(error)
            }
        } else {
            alert(`Exercise "${normalizedName}" added!`)
            setName('')
            setType('')
        }
    }

    return (
        <div className="add-exercise-form">
            <input
                type="text"
                value={name}
                placeholder="Exercise name"
                onChange={(e) => setName(e.target.value)}
            />

            <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Select type</option>
                {types.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>

            <button onClick={handleAddExercise}>Add Exercise</button>

            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}
        </div>
    )
}
