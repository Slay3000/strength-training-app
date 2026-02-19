import { openDB } from 'idb'

// IMPORTANT: bump version number when adding new stores
export const dbPromise = openDB('workout-offline-db', 2, {
    upgrade(db, oldVersion) {
        // Create exercises store
        if (!db.objectStoreNames.contains('exercises')) {
            db.createObjectStore('exercises', { keyPath: 'id' })
        }

        // Create pending exercises store
        if (!db.objectStoreNames.contains('pendingExercises')) {
            db.createObjectStore('pendingExercises', {
                keyPath: 'tempId',
                autoIncrement: true,
            })
        }
    },
})
