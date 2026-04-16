/**
 * Retorna a URL pública da aplicação para montar links em emails transacionais
 * (confirmação de cadastro, reset de senha etc.).
 *
 * Em produção deve vir de NEXT_PUBLIC_APP_URL. Em dev, caímos para localhost.
 */
export function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }
  return "http://localhost:3000"
}
