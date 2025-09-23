'use client'

import { useState, useEffect } from 'react'

export interface Technician {
  id: string
  name: string
  email: string
  role: 'technician' | 'supervisor_tecnico'
  active: boolean
}

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const fetchTechnicians = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/users/technicians')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar técnicos')
      }

      const data = await response.json()
      setTechnicians(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar técnicos:', err)
    } finally {
      setLoading(false)
    }
  }

  const getActiveTechnicians = () => {
    return technicians.filter(tech => tech.active)
  }

  const getTechnicianById = (id: string) => {
    return technicians.find(tech => tech.id === id)
  }

  const getTechnicianByEmail = (email: string) => {
    return technicians.find(tech => tech.email === email)
  }

  return {
    technicians,
    loading,
    error,
    refetch: fetchTechnicians,
    getActiveTechnicians,
    getTechnicianById,
    getTechnicianByEmail
  }
}