import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'

export function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4">
      <Card className="max-w-lg text-center">
        <h1 className="font-display text-4xl font-extrabold text-adventure-700">MathAdventura</h1>
        <p className="mt-3 text-adventure-800">
          Explore a fantasy world, battle tricky math challenges, and level up your skills!
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/register"
            className="font-display rounded-2xl bg-adventure-500 px-5 py-2.5 font-semibold text-white shadow-md shadow-adventure-900/20 transition-transform hover:bg-adventure-600 active:scale-95"
          >
            Start Your Quest
          </Link>
          <Link
            to="/login"
            className="font-display rounded-2xl bg-gold-400 px-5 py-2.5 font-semibold text-adventure-900 shadow-md shadow-gold-700/20 transition-transform hover:bg-gold-500 active:scale-95"
          >
            I Have an Account
          </Link>
        </div>
      </Card>
    </div>
  )
}
