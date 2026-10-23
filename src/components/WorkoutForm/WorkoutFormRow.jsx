// Single exercise row within WorkoutForm (selector + dropdown + stats + reps/weight + steppers)
export default function WorkoutFormRow({
    row,
    searchTerm,
    onSearchTermChange,
    isDropdownOpen,
    onToggleDropdown,
    filteredDropdown,
    onSelectExercise,
    onChangeField,
    onRemoveRow,
    canRemove,
    stats,
}) {
    const handleUseLast = () => {
        if (!stats?.last) return
        onChangeField('reps', stats.last.reps.toString())
        onChangeField('weight', stats.last.weight.toString())
    }

    const adjustReps = (delta) => {
        const current = Number(row.reps) || 0
        const next = Math.max(1, current + delta)
        onChangeField('reps', next.toString())
    }

    const adjustWeight = (delta) => {
        const current = Number(row.weight) || 0
        const next = Math.max(0, parseFloat((current + delta).toFixed(1)))
        onChangeField('weight', next.toString())
    }

    return (
        <div className="exercise-row">
            {/* FIRST ROW: EXERCISE SELECTOR (FULL WIDTH) */}
            <div className="exercise-select-wrapper">
                <div className="exercise-select-container">
                    <input
                        type="text"
                        className="exercise-input"
                        placeholder="Select exercise..."
                        value={searchTerm}
                        onChange={(e) => {
                            onSearchTermChange(e.target.value)
                            onToggleDropdown(true)
                        }}
                        onFocus={() => onToggleDropdown(true)}
                    />

                    {isDropdownOpen && (
                        <div className="dropdown-list">
                            {filteredDropdown.length === 0 ? (
                                <div className="dropdown-empty">
                                    No exercises found
                                </div>
                            ) : (
                                filteredDropdown.map((group) => (
                                    <div
                                        key={group.type}
                                        className="dropdown-group"
                                    >
                                        <div className="dropdown-type">
                                            {group.type}
                                        </div>
                                        {group.list.map((ex) => (
                                            <div
                                                key={ex.id}
                                                className={`dropdown-item${
                                                    row.exerciseId === ex.id
                                                        ? ' selected'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    onSelectExercise(ex)
                                                }
                                            >
                                                {ex.name}
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    {stats?.last && (
                        <div className="exercise-history-hint">
                            <span>
                                Last: {stats.last.reps} × {stats.last.weight} kg
                                {stats.max &&
                                    ` | Max: ${stats.max.reps} × ${stats.max.weight} kg`}
                            </span>
                            <button
                                type="button"
                                className="use-last-chip"
                                onClick={handleUseLast}
                                title="Auto-fill with last workout values"
                            >
                                ⚡ Use Last ({stats.last.reps} × {stats.last.weight} kg)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SECOND ROW: REPS + WEIGHT + REMOVE (INLINE) */}
            <div className="inputs-row">
                <input
                    type="number"
                    className="reps-input"
                    placeholder="Reps"
                    value={row.reps}
                    onChange={(e) => onChangeField('reps', e.target.value)}
                />

                <input
                    type="number"
                    className="weight-input"
                    placeholder="Weight (kg)"
                    value={row.weight}
                    onChange={(e) => onChangeField('weight', e.target.value)}
                />

                {canRemove && (
                    <button
                        className="remove-row-button"
                        onClick={onRemoveRow}
                    >
                        Remove
                    </button>
                )}
            </div>

            {/* THIRD ROW: QUICK STEPPERS (MOBILE FRIENDLY) */}
            <div className="quick-steppers-row">
                <div className="stepper-group">
                    <span className="stepper-label">Reps:</span>
                    <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustReps(-1)}
                    >
                        -1
                    </button>
                    <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustReps(+1)}
                    >
                        +1
                    </button>
                </div>
                <div className="stepper-group">
                    <span className="stepper-label">Weight:</span>
                    <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustWeight(-2.5)}
                    >
                        -2.5
                    </button>
                    <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustWeight(+2.5)}
                    >
                        +2.5
                    </button>
                    <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => adjustWeight(+5)}
                    >
                        +5
                    </button>
                </div>
            </div>
        </div>
    )
}
