// Pure fitness calculation utilities

/**
 * Estimates 1-Rep Max using the Brzycki formula.
 * @param {number} weight - weight lifted in kg
 * @param {number} reps - number of reps performed
 * @returns {number} estimated 1RM in kg
 */
export function calculate1RM(weight, reps) {
    const w = Number(weight) || 0
    const r = Number(reps) || 0
    if (w <= 0 || r <= 0) return 0
    if (r === 1) return w
    return Math.round(w * (1 + r / 30))
}

