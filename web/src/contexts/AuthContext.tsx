import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: any | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any; requiresConfirmation?: boolean; message?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session from Supabase
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else if (session) {
          setSession(session)
          setUser(session.user)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'Failed to sign in' }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('Attempting Supabase signup with:', { email, hasPassword: !!password, fullName })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })
      
      console.log('Supabase signup response:', { data, error })
      
      if (error) {
        console.error('Supabase signup error:', error)
        return { error: error.message }
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { 
          error: null, 
          requiresConfirmation: true,
          message: 'Please check your email to confirm your account.'
        }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error: 'Failed to create account' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: 'Failed to reset password' }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      if (!user) {
        return { error: 'No user logged in' }
      }
      
      const { error } = await supabase.auth.updateUser({
        password
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { error: 'Failed to update password' }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}