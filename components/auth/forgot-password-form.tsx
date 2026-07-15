'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface ForgotPasswordFormProps {
  locale: Locale
  dictionary: Dictionary
}

export function ForgotPasswordForm({ locale, dictionary }: ForgotPasswordFormProps) {
  const t = dictionary
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      // The recovery link lands on /auth/callback, which exchanges the code for
      // a session and then forwards to the update-password page.
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        `/${locale}/auth/update-password`,
      )}`

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

      if (error) {
        toast.error(error.message)
        return
      }

      // Always show success to avoid leaking which emails are registered.
      setSent(true)
    } catch (error) {
      console.error('Reset password error:', error)
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
          {locale === 'hu' ? 'Elfelejtett jelszó' : 'Forgot password'}
        </CardTitle>
      </CardHeader>

      {sent ? (
        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground">
            {locale === 'hu'
              ? 'Ha létezik fiók ezzel az email címmel, elküldtük a jelszó-visszaállító linket. Ellenőrizd a postaládádat (és a spam mappát is).'
              : 'If an account exists for this email, we have sent a password reset link. Check your inbox (and spam folder).'}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${locale}/auth/login`}>
              {locale === 'hu' ? 'Vissza a bejelentkezéshez' : 'Back to login'}
            </Link>
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {locale === 'hu'
                ? 'Add meg az email címed, és küldünk egy linket a jelszó visszaállításához.'
                : 'Enter your email and we will send you a link to reset your password.'}
            </p>
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              {locale === 'hu' ? 'Visszaállító link küldése' : 'Send reset link'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                {locale === 'hu' ? 'Vissza a bejelentkezéshez' : 'Back to login'}
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
