// Layout compartilhado pelas rotas públicas (sign-in, sign-up...): só centraliza
// o conteúdo na tela, sem nenhuma lógica de autenticação (isso fica no proxy.ts).
const PublicLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      {children}
    </main>
  )
}

export default PublicLayout
