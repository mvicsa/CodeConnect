'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setData({ ...data, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('http://localhost:5000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setLoading(false)
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 bg-black rounded-2xl ring-1 ring-white/10">
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <button type="button" className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20">
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22 12.24c0-.63-.06-1.24-.17-1.83H12v3.47h5.6a4.8 4.8 0 01-2.07 3.13v2.6h3.36c1.98-1.82 3.11-4.49 3.11-7.37z"/><path fill="#34A853" d="M12 24c2.7 0 4.97-.9 6.63-2.45l-3.36-2.6c-.94.63-2.16 1-3.27 1-2.52 0-4.66-1.7-5.42-3.98H3.12v2.5A12 12 0 0012 24z"/><path fill="#FBBC05" d="M6.58 14.97A7.18 7.18 0 016.2 12c0-.98.18-1.92.5-2.8v-2.5H3.12A12 12 0 000 12c0 1.91.44 3.72 1.22 5.35l3.36-2.38z"/><path fill="#EA4335" d="M12 4.75c1.47 0 2.79.52 3.83 1.55l2.86-2.86C16.94 1.36 14.67.36 12 .36a12 12 0 00-8.88 4.34l3.36 2.38C7.34 5.58 9.48 4.75 12 4.75z"/></svg>
                Google
              </button>
              <button type="button" className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 .297C5.373.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577v-2.21c-3.338.726-4.033-1.415-4.033-1.415-.546-1.387-1.333-1.758-1.333-1.758-1.09-.746.082-.73.082-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.809 1.304 3.495.997.108-.776.42-1.304.763-1.604-2.665-.3-5.466-1.333-5.466-5.931 0-1.31.469-2.381 1.234-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.323 3.301 1.23a11.47 11.47 0 013.004-.404c1.02.005 2.05.138 3.003.404 2.292-1.553 3.298-1.23 3.298-1.23.653 1.653.242 2.873.118 3.176.767.84 1.233 1.911 1.233 3.221 0 4.609-2.803 5.628-5.475 5.921.432.371.816 1.102.816 2.222v3.293c0 .32.218.694.825.577C20.565 22.092 24 17.6 24 12.297 24 5.67 18.627.297 12 .297z"/></svg>
                Github
              </button>
              <button type="button" className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.088 3.163 9.428 7.558 11.117.553.101.756-.24.756-.533 0-.263-.01-1.134-.016-2.06-3.074.673-3.724-1.482-3.724-1.482-.504-1.28-1.233-1.62-1.233-1.62-1.008-.688.077-.674.077-.674 1.114.078 1.699 1.143 1.699 1.143.992 1.699 2.605 1.209 3.238.925.101-.721.389-1.21.708-1.488-2.454-.279-5.033-1.227-5.033-5.461 0-1.206.428-2.194 1.134-2.967-.114-.277-.49-1.396.107-2.91 0 0 .922-.295 3.027 1.126a10.44 10.44 0 012.753-.37c.934.004 1.878.13 2.758.38 2.103-1.421 3.024-1.126 3.024-1.126.598 1.514.222 2.633.109 2.91.708.773 1.132 1.761 1.132 2.967 0 4.244-2.584 5.178-5.046 5.452.399.344.758 1.026.758 2.067 0 1.493-.014 2.695-.014 3.061 0 .296.198.641.765.531C20.845 21.421 24 17.087 24 12 24 5.373 18.627 0 12 0z"/></svg>
                Gitlab
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="firstName" placeholder="First Name" value={data.firstName} onChange={handleChange} className="w-full rounded-md bg-white/5 px-4 py-2 border border-white/10 focus:outline-none focus:border-yellow-400" />
              <input type="text" name="lastName" placeholder="Last Name" value={data.lastName} onChange={handleChange} className="w-full rounded-md bg-white/5 px-4 py-2 border border-white/10 focus:outline-none focus:border-yellow-400" />
            </div>
            <input type="text" name="username" placeholder="Username" value={data.username} onChange={handleChange} className="w-full rounded-md bg-white/5 px-4 py-2 border border-white/10 focus:outline-none focus:border-yellow-400" />
            <input type="email" name="email" placeholder="Email" value={data.email} onChange={handleChange} className="w-full rounded-md bg-white/5 px-4 py-2 border border-white/10 focus:outline-none focus:border-yellow-400" />
            <input type="password" name="password" placeholder="Password" value={data.password} onChange={handleChange} className="w-full rounded-md bg-white/5 px-4 py-2 border border-white/10 focus:outline-none focus:border-yellow-400" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-md bg-gradient-to-r from-yellow-300 to-yellow-500 text-black font-semibold hover:opacity-90">
              {loading ? '...' : 'Sign Up'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              By creating an account, you agree to the <a href="#" className="underline">Terms of Service</a>.
            </p>
            <p className="text-sm text-center">
              Already have an account? <a href="/login" className="underline">Login</a>
            </p>
          </form>
        </div>
        <div className="p-10 flex flex-col justify-between border-l border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold">
             
              <span>Superlist</span>
               <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight">Start your 30‑day free trial</h1>
            <p className="mt-2 text-sm text-gray-400">No credit card required</p>
          </div>
          <ul className="space-y-6 mt-10 text-sm">
            <li>
              <p className="flex items-center gap-2 font-medium">
                
                Invite unlimited colleagues
                <span className="w-6 h-6 flex-none rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400 fill-current"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6-1.01z" /></svg>
                </span>
              </p>
              <p className="text-gray-400 pl-8">Integrate with developer‑friendly APIs or build your own.</p>
            </li>
            <li>
              <p className="flex items-center gap-2 font-medium">
               
                Ensure compliance
                 <span className="w-6 h-6 flex-none rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400 fill-current"><path d="M12 2a10 10 0 00-3.16 19.49h6.32A10 10 0 0012 2zm1 15h-2v-2h2zm0-4h-2V7h2z" /></svg>
                </span>
              </p>
              <p className="text-gray-400 pl-8">Get real‑time insights on your numbers and visitors.</p>
            </li>
            <li>
              

<p className="flex items-center gap-2 font-medium">
               
                Built‑in security
 <span className="w-6 h-6 flex-none rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400 fill-current"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" /></svg>
                </span>

              </p>

              <p className="text-gray-400 pl-8">Keep team members and customers in the loop.</p>
              
            </li>
          </ul>
          <footer className="mt-10 text-xs text-gray-500">
            <nav className="flex gap-4">
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
              <a href="#">Docs</a>
              <a href="#">Help</a>
            </nav>
            <div className="mt-4">English</div>
          </footer>
        </div>
      </div>
    </div>
  )
}
