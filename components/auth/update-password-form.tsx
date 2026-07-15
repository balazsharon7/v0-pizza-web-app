'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface UpdatePasswordFormProps {
  locale: Locale
  dictionary: Dictionary
}

export function UpdatePasswordForm({ locale, dictionary }: UpdatePasswordFormProps) {
  const router = useRouter()
  const t = dictionary
  const [isLoading, setIsLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // A valid recovery link means /auth/callback has already exchanged the code
  // for a session, so a session must be present to allow the password change.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error(
        locale === 'hu'
          ? 'A jelszónak legalább 6 karakternek kell lennie'
          : 'Password must be at least 6 characters',
      )
      return
    }
    if (password !== confirmPassword) {
      toast.error(locale === 'hu' ? 'A jelszavak nem egyeznek' : 'Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(
        locale === 'hu' ? 'A jelszavad frissült!' : 'Your password has been updated!',
      )
      router.push(`/${locale}`)
      router.refresh()
    } catch (error) {
      console.error('Update password error:', error)
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
        <CardTitle className="font-serif text-2xl">
          {locale === 'hu' ? 'Új jelszó megadása' : 'Set new password'}
        </CardTitle>
      </CardHeader>

      {checking ? (
        <CardContent className="flex justify-center py-8">
          <Spinner className="h-6 w-6" />
        </CardContent>
      ) : !hasSession ? (
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {locale === 'hu'
              ? 'A visszaállító link érvénytelen vagy lejárt. Kérj újat.'
              : 'This reset link is invalid or has expired. Please request a new one.'}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${locale}/auth/forgot-password`}>
              {locale === 'hu' ? 'Új link kérése' : 'Request a new link'}
            </Link>
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{locale === 'hu' ? 'Új jelszó' : 'New password'}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              {locale === 'hu' ? 'Jelszó frissítése' : 'Update password'}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
