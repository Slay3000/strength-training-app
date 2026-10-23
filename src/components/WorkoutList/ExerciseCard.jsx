import { getPRSetIds } from '../../utils/workoutStats'
import PRStatsBox from './PRStatsBox'

function computePRStats(workouts, exerciseId, todaySets) {
    if (!exerciseId) {
        return {
            setPR: 0,
            exercisePR: 0,
            todayLoad: 0,
            progress: 0,
            remaining: 0,
        }
    }

    const all = workouts.filter((w) => w.exercise_id === exerciseId)
    const setPR = all.length ? Math.max(...all.map((w) => w.weight || 0)) : 0

    const dailyTotals = {}
    all.forEach((w) => {
        const ymd =
            w.ymd ||
            (w.created_at
                ? new Date(w.created_at).toISOString().slice(0, 10)
                : 'today')
        dailyTotals[ymd] =
            (dailyTotals[ymd] || 0) + (w.weight || 0) * (w.reps || 0)
    })
    const exercisePR = Object.values(dailyTotals).length
        ? Math.max(...Object.values(dailyTotals))
        : 0

    const todayLoad = todaySets.reduce(
        (sum, s) => sum + (s.weight || 0) * (s.reps || 0),
        0,
    )
    const progress =
        exercisePR > 0 ? Math.min(100, (todayLoad / exercisePR) * 100) : 0
    const remaining = exercisePR - todayLoad

    return { setPR, exercisePR, todayLoad, progress, remaining }
}

// Single exercise card: header, numbered set list, PR badges, PR toggle
export default function ExerciseCard({
    name,
    sets,
    exKey,
    workouts,
    hideDate,
    onEdit,
    onDelete,
    openPR,
    setOpenPR,
    collapsed,
    onToggle,
}) {
    const totalReps = sets.reduce((s, x) => s + (x.reps || 0), 0)
    const bestSet = sets.reduce(
        (m, x) => Math.max(m, (x.weight || 0) * (x.reps || 0)),
        0,
    )
    const exerciseId = sets[0]?.exercise_id
    const { setPR, exercisePR, todayLoad, progress, remaining } =
        computePRStats(workouts, exerciseId, sets)

    // Identify which set (if any) achieved a PR over prior workouts
    const todaySetIds = new Set(sets.map((s) => s.id))
    const priorWorkouts = workouts.filter(
        (w) => w.exercise_id === exerciseId && !todaySetIds.has(w.id),
    )
    const { weightPRSetIds, e1RMPRSetIds } = getPRSetIds(sets, priorWorkouts)

    return (
        <div className="exercise-card">
            <div className="exercise-header" onClick={onToggle}>
                {name} {collapsed ? '+' : '-'}
            </div>

            {!collapsed && (
                <>
                    {sets.map((s, idx) => {
                        const isWeightPR = weightPRSetIds.has(s.id)
                        const isE1RMPR = e1RMPRSetIds.has(s.id)

                        return (
                            <div key={s.id} className="workout-item-card">
                                <div className="set-details-wrapper">
                                    <span className="set-number-badge">
                                        Set {idx + 1}
                                    </span>
                                    <span className="set-metrics">
                                        {s.reps} reps @ {s.weight} kg
                                    </span>
                                    {isWeightPR && (
                                        <span
                                            className="set-pr-badge"
                                            title="All-time Weight PR for this exercise"
                                        >
                                            🏆 PR
                                        </span>
                                    )}
                                    {!isWeightPR && isE1RMPR && (
                                        <span
                                            className="set-pr-badge"
                                            title="All-time Estimated 1RM PR"
                                        >
                                            🏆 1RM PR
                                        </span>
                                    )}
                                </div>
                                {hideDate && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(s)}
                                            className="edit-button"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(s.id)}
                                            className="delete-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {hideDate && (
                        <button
                            className="pr-toggle-button"
                            onClick={() =>
                                setOpenPR((prev) => ({
                                    ...prev,
                                    [exKey]: !prev[exKey],
                                }))
                            }
                        >
                            {openPR[exKey] ? 'Hide Stats' : 'Show Stats'}
                        </button>
                    )}

                    {hideDate && openPR[exKey] && (
                        <PRStatsBox
                            exercisePR={exercisePR}
                            setPR={setPR}
                            todayLoad={todayLoad}
                            progress={progress}
                            remaining={remaining}
                            totalReps={totalReps}
                            bestSet={bestSet}
                        />
                    )}
                </>
            )}
        </div>
    )
}
