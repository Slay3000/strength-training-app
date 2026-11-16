// Pure fitness calculation utilities

/**
 * Calculates the Wilks2 (2020 revised) score for relative strength comparison.
 * @param {number} bodyweightKg - lifter's bodyweight in kg
 * @param {number} liftedKg - weight lifted in kg (best single-set weight)
 * @param {boolean} isMale - true for male coefficients, false for female
 * @returns {number} Wilks score rounded to 1 decimal, or 0 if inputs are invalid
 */
export function calculateWilks(bodyweightKg, liftedKg, isMale = true) {
    const bw = Number(bodyweightKg) || 0
    const lifted = Number(liftedKg) || 0
    if (bw <= 0 || lifted <= 0) return 0

    const coeff = isMale
        ? { a: -216.0475144, b: 16.2606339, c: -0.002388645, d: -0.00113732, e: 7.01863e-6, f: -1.291e-8 }
        : { a: 594.31747775582, b: -27.23842536447, c: 0.82112226871, d: -0.00930733913, e: 4.731582e-5, f: -9.054e-8 }

    const { a, b, c, d, e, f } = coeff
    const denom = a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5
    if (!denom || denom <= 0) return 0

    return Math.round((lifted / denom) * 500 * 10) / 10
}

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

