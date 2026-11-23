import { useState } from 'react'
import { supabase } from '../utils/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function entrar() {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-80 space-y-3">
        <input className="w-full border p-2 rounded" type="email" placeholder="Correo"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Contraseña"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && entrar()} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-black text-white p-2 rounded" onClick={entrar}>
          Entrar
        </button>
      </div>
    </div>
  )
}