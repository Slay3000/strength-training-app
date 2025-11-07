// Represents a single workout entry with normalized fields

export class WorkoutModel {
    constructor(data) {
        this.id = data.id
        this.date = new Date(data.created_at)
        this.ymd = this.date.toISOString().slice(0, 10)
        this.section = data.exercises?.type || 'Unknown'
        this.exercise = data.exercises?.name || 'Unknown Exercise'
        this.weight = Number(data.weight) || 0
        this.reps = Number(data.reps) || 0
        this.load = this.weight * this.reps
    }
}
