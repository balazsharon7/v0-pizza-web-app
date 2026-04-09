'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface LoginFormProps {
  locale: Locale
  dictionary: Dictionary
}

export function LoginForm({ locale, dictionary }: LoginFormProps) {
  const router = useRouter()
  const t = dictionary
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <span className="font-serif text-lg font-bold text-primary-foreground">TV</span>
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
            <Label htmlFor="password">{t.auth.password}</Label>
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
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" /> : null}
            {t.auth.loginButton}
          </Button>
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
