export function computeTodayLoad(workouts, todayStr) {
    const today = workouts.filter((w) => w.created_at.slice(0, 10) === todayStr)
    return today.reduce((sum, w) => sum + (w.weight || 0) * (w.reps || 0), 0)
}

export function computeCurrentProportions(weeklySections) {
    const total = Object.values(weeklySections).reduce(
        (sum, sec) => sum + (sec.currentWeekAvg || 0),
        0,
    )

    return Object.fromEntries(
        Object.entries(weeklySections).map(([muscle, sec]) => {
            const load = sec.currentWeekAvg || 0
            return [muscle, total > 0 ? load / total : 0]
        }),
    )
}

export function computeTargetProportions(muscleTargets) {
    const sum = Object.values(muscleTargets).reduce((a, b) => a + b, 0)

    return Object.fromEntries(
        Object.entries(muscleTargets).map(([muscle, ratio]) => [
            muscle,
            ratio / sum,
        ]),
    )
}
