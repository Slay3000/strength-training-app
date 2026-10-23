export function getLastWeekTip(undertrained) {
    if (undertrained.length === 0)
        return 'Tip: Great balance last week! Keep it up 🔥'

    if (undertrained.length === 1) {
        const m = undertrained[0].muscle
        return `Tip: Last week lacked focus on ${m}. Prioritize it today.`
    }

    const muscles = undertrained.map((x) => x.muscle).join(', ')
    return `Tip: Last week lacked focus on ${muscles}. Prioritize these today.`
}

export function getThisWeekTip(undertrained) {
    if (undertrained.length === 0)
        return 'This Week Tip: This week is well balanced so far. Great job 🔥'

    const muscles = undertrained.map((x) => x.muscle).join(', ')
    return `This Week Tip: You undertrained ${muscles} so far. Focus on them today.`
}

/**
 * Computes training balance tips based on weekly section averages and target proportions.
 */
export function computeTrainingTips({
    weeklyAverages,
    targetProportions,
    currentProportions,
    todayLoad,
}) {
    const sectionLoads = weeklyAverages?.sections || {}

    // ---- Last Week Tip ----
    const totalLastWeek = Object.values(sectionLoads).reduce(
        (sum, sec) => sum + (sec.previousWeekAvg || 0),
        0,
    )

    const actualProportionsLastWeek = Object.fromEntries(
        Object.entries(sectionLoads).map(([muscle, sec]) => {
            const load = sec.previousWeekAvg || 0
            return [muscle, totalLastWeek > 0 ? load / totalLastWeek : 0]
        }),
    )

    const imbalanceLastWeek = Object.entries(targetProportions).map(
        ([muscle, target]) => ({
            muscle,
            diffPercent: (actualProportionsLastWeek[muscle] || 0) - target,
        }),
    )

    const undertrainedLastWeek = imbalanceLastWeek
        .filter((x) => x.diffPercent < -0.05)
        .sort((a, b) => a.diffPercent - b.diffPercent)

    const workoutTip = getLastWeekTip(undertrainedLastWeek)

    // ---- This Week Tip ----
    const imbalanceThisWeek = Object.entries(targetProportions).map(
        ([muscle, target]) => ({
            muscle,
            diffPercent: (currentProportions[muscle] || 0) - target,
        }),
    )

    const undertrainedThisWeek = imbalanceThisWeek
        .filter((x) => x.diffPercent < -0.05)
        .sort((a, b) => a.diffPercent - b.diffPercent)

    const thisWeekTip = getThisWeekTip(undertrainedThisWeek)

    // hide thisWeekTip for first workout of the week
    const totalThisWeek = Object.values(sectionLoads).reduce(
        (sum, sec) => sum + (sec.currentWeekAvg || 0),
        0,
    )
    const hideThisWeekTip = totalThisWeek === todayLoad

    return { workoutTip, thisWeekTip, hideThisWeekTip }
}
