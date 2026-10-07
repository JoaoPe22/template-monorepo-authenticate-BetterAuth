'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { authClient } from '@/auth/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

const esqueciASenhaSchema = z.object({
  email: z.email('Formato de e-mail inválido').min(1, 'O e-mail é obrigatório'),
})

type EsqueciASenhaFormData = z.infer<typeof esqueciASenhaSchema>

const Page = () => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    register,
  } = useForm<EsqueciASenhaFormData>({
    resolver: zodResolver(esqueciASenhaSchema),
    defaultValues: { email: '' },
  })

  const handleEsqueciASenha = async (data: EsqueciASenhaFormData) => {
    try {
      // `redirectTo` é pra onde o better-auth manda o usuário depois de validar
      // o token do e-mail — ele anexa ?token=... nessa URL.
      const response = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: '/redefinir-senha',
      })

      if (response.error) {
        toast.error('Erro ao solicitar a redefinição. Tente novamente.')
        return
      }

      // Mensagem genérica de propósito: confirmar se o e-mail existe ou não
      // entregaria a lista de usuários cadastrados para quem ficar testando.
      toast.success(
        'Se houver uma conta com esse e-mail, enviamos o link de redefinição.',
      )
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error)
      toast.error('Erro ao solicitar a redefinição. Tente novamente.')
    }
  }

  const disabled = isSubmitting || isSubmitSuccessful

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Esqueci a senha</CardTitle>
        <CardDescription>
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleEsqueciASenha)} method="post">
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
                disabled={disabled}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <Button type="submit" variant="secondary" disabled={disabled}>
                {isSubmitting && <Spinner />}
                Enviar link
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in" prefetch={false}>
            Voltar para o login
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Page
