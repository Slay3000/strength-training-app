import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './LoginForm.css'

export default function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState('login') // login | signup
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!email || !password) {
            setError('Please enter email and password.')
            setLoading(false)
            return
        }

        try {
            let result

            if (mode === 'login') {
                result = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
            } else {
                result = await supabase.auth.signUp({
                    email,
                    password,
                })
            }

            if (result.error) {
                setError(result.error.message)
            } else {
                // Auth will trigger useAuth -> App rerenders
            }
        } catch (err) {
            setError('Unexpected error. Try again.')
        }

        setLoading(false)
    }

    return (
        <div className="login-wrapper">
            <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

            <form onSubmit={handleSubmit} className="login-form">
                <input
                    type="email"
                    placeholder="Email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <div className="login-error">{error}</div>}

                <button disabled={loading}>
                    {loading
                        ? 'Please wait…'
                        : mode === 'login'
                          ? 'Sign In'
                          : 'Sign Up'}
                </button>
            </form>
            {/* 
            <div className="login-switch">
                {mode === 'login' ? (
                    <span>
                        Don’t have an account?{' '}
                        <button onClick={() => setMode('signup')}>
                            Sign up
                        </button>
                    </span>
                ) : (
                    <span>
                        Already have an account?{' '}
                        <button onClick={() => setMode('login')}>
                            Sign in
                        </button>
                    </span>
                )}
            </div> */}
        </div>
    )
}
