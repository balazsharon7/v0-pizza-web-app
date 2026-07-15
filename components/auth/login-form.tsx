'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface LoginFormProps {
  locale: Locale
  dictionary: Dictionary
}

export function LoginForm({ locale, dictionary }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = dictionary
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Surface auth/OAuth errors that /auth/callback redirects back with.
  useEffect(() => {
    if (searchParams.get('error')) {
      toast.error(
        locale === 'hu'
          ? 'A bejelentkezés nem sikerült. Próbáld újra.'
          : 'Sign-in failed. Please try again.',
      )
    }
  }, [searchParams, locale])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(locale === 'hu' ? 'Sikeres bejelentkezés!' : 'Successfully logged in!')
      router.push(`/${locale}`)
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      toast.error(t.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 relative w-20 h-20">
          <Image src="/hero/logo-hero.png" alt="Terra Verde Pizzéria" fill className="object-contain" />
        </div>
        <CardTitle className="font-serif text-2xl">{t.auth.loginTitle}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-sm text-primary hover:underline"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" /> : null}
            {t.auth.loginButton}
          </Button>
          
          <SocialAuthButtons locale={locale} />
          
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{' '}
            <Link href={`/${locale}/auth/register`} className="text-primary hover:underline">
              {t.common.register}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
