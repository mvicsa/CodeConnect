'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`http://localhost:5000/users?email=${email}`)
    const users = await res.json()
    if (users.length > 0) {
      await fetch('http://localhost:5000/passwordResets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, requestedAt: Date.now() })
      })
      setSent(true)
    } else {
      setError('Email not found')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#0b0b0b] text-white p-8 rounded-lg shadow-lg space-y-6">
        <h1 className="text-2xl font-semibold text-center">Forgot Password</h1>
        {sent ? (
          <p className="text-center text-sm text-green-400">Reset link sent to your email</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-400"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full py-3 rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold hover:opacity-90">
              Send Reset Link
            </button>
          </>
        )}
        <p className="text-sm text-center text-gray-400">
          Remembered? <a href="/login" className="text-yellow-400 hover:underline">Login</a>
        </p>
      </form>
    </div>
  )
}
