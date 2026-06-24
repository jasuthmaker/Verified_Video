import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { User, UserRole, AgeBracket, AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current user from Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) throw authError

        if (authUser) {
          // Fetch full user profile from database
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileError) throw profileError

          setUser(userProfile as User)
        }
      } catch (err) {
        console.error('Auth initialization failed:', err)
        setError(err instanceof Error ? err.message : 'Auth failed')
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userProfile) {
          setUser(userProfile as User)
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, role: UserRole, ageBracket: AgeBracket) => {
    try {
      setError(null)

      // Sign up with Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            age_bracket: ageBracket,
          },
        },
      })

      if (authError) throw authError
      if (!authUser) throw new Error('Sign up failed')

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email,
          role,
          age_bracket: ageBracket,
          is_active: true,
        })

      if (profileError) throw profileError

      setUser({
        id: authUser.id,
        email,
        role,
        age_bracket: ageBracket,
        has_parental_consent: ageBracket === '13+',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMessage)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)

      const { data: { user: authUser }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError
      if (!authUser) throw new Error('Sign in failed')

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id)

      // Fetch full profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userProfile) {
        setUser(userProfile as User)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMessage)
      throw err
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setError(null)

      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, ...updates })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed'
      setError(errorMessage)
      throw err
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
