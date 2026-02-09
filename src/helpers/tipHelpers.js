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
