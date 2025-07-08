'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [data, setData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setData({ ...data, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`http://localhost:5000/users?username=${data.username}&password=${data.password}`)
    const users = await res.json()
    users.length ? router.push('/dashboard') : setError('Invalid username or password')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#0b0b0b] text-white p-8 rounded-lg shadow-lg space-y-6">
        <div>
          <label className="block text-sm mb-1">Username or email</label>
          <input
            type="text"
            name="username"
            placeholder="Username or email"
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-400 pr-10"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="remember" className="accent-yellow-400" />
          <label htmlFor="remember" className="text-sm">Remember Me</label>
        </div>

        {error && (
          <>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-right">
              <a href="/forgot-password" className="text-yellow-400 text-xs underline">Forgot Password?</a>
            </p>
          </>
        )}

        <button type="submit" className="w-full py-3 rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold hover:opacity-90">
          Login
        </button>

        <p className="text-sm text-center text-gray-400">
          Do not have an account? <a href="/register" className="text-yellow-400 hover:underline">Sign Up</a>
        </p>
      </form>
    </div>
  )
}
