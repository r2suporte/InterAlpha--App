'use client'

import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Criar sua conta</h1>
        <p className="text-gray-600 mt-2">Comece sua jornada conosco hoje</p>
      </div>
      
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border-0 bg-white/80 backdrop-blur-sm",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          }
        }}
      />
    </div>
  )
}