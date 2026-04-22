'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n/config'

interface SocialAuthButtonsProps {
  locale: Locale
}

export function SocialAuthButtons({ locale }: SocialAuthButtonsProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?locale=${locale}`,
        },
      })
      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'An error occurred')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setIsFacebookLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?locale=${locale}`,
        },
      })
      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      console.error('Facebook sign in error:', error)
      toast.error(locale === 'hu' ? 'Hiba történt' : 'An error occurred')
    } finally {
      setIsFacebookLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {locale === 'hu' ? 'vagy' : 'or'}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isFacebookLoading}
      >
        {isGoogleLoading ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {locale === 'hu' ? 'Folytatás Google-lal' : 'Continue with Google'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleFacebookSignIn}
        disabled={isGoogleLoading || isFacebookLoading}
      >
        {isFacebookLoading ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        )}
        {locale === 'hu' ? 'Folytatás Facebook-kal' : 'Continue with Facebook'}
      </Button>
    </div>
  )
}
