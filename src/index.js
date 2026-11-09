import React from 'react'
import ReactDOM from 'react-dom/client'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import './index.css'
import App from './App'
import { HashRouter } from 'react-router-dom'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
)

const root = ReactDOM.createRoot(document.getElementById('root'))
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister())
    })

    // Clear old caches created by CRA SW
    caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key))
    })
}
root.render(
    <React.StrictMode>
        <HashRouter>
            <App />
        </HashRouter>
    </React.StrictMode>,
)
