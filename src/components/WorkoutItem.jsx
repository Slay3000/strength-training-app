export default function WorkoutItem({ workout, onDelete }) {
    const date = new Date(workout.created_at).toISOString().slice(0, 10)

    return (
        <li className="workout-item">
            <div className="workout-info">
                <div className="workout-name">
                    {workout.exercises.name} ({workout.exercises.type})
                </div>
                <div className="workout-details">
                    {workout.reps} reps @ {workout.weight}kg — {date}
                </div>
            </div>
            <button
                className="workout-delete"
                onClick={() => onDelete(workout.id)}
            >
                Delete
            </button>
        </li>
    )
}
