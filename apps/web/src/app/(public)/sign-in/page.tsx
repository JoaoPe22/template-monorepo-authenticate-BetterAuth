'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { authClient } from '@/auth/client'
import { GoogleIcon } from '@/components/icons/google-icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'

const signInSchema = z.object({
  email: z.email('Formato de e-mail inválido').min(1, 'O e-mail é obrigatório'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  rememberMe: z.boolean().optional(),
})

type SignInFormData = z.infer<typeof signInSchema>

const Page = () => {
  const router = useRouter()
  const query = useQueryClient()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const handleLogin = async (data: SignInFormData) => {
    try {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      })

      if (response.error) {
        if (response.error.status === 403) {
          toast.error(
            'Confirme seu e-mail antes de entrar. Reenviamos o link de confirmação.',
          )
          return
        }

        toast.error('Erro ao fazer login. Verifique suas credenciais.')
        return
      }

      query.clear()

      toast.success('Login realizado com sucesso!')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      toast.error('Erro ao fazer login. Tente novamente.')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/' })
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error)
      toast.error('Erro ao fazer login com Google. Tente novamente.')
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Login</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleLogin)} method="post">
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FieldLabel htmlFor="rememberMe">Lembrar-me</FieldLabel>
            </Field>

            <Field>
              <Button type="submit" variant="secondary" disabled={isSubmitting}>
                {isSubmitting && <Spinner />}
                Entrar
              </Button>
            </Field>

            <FieldSeparator>ou</FieldSeparator>

            <Field>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <GoogleIcon />
                Continuar com Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/esqueci-a-senha" prefetch={false}>
            Esqueci minha senha
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-up" prefetch={false}>
            Criar uma conta
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Page
