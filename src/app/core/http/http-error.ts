/**
 * Mensaje legible para un error HTTP.
 *
 * El backend responde con ProblemDetail, asi que el campo "detail" trae un
 * mensaje util: la cuota del plan agotada, un slug repetido. Mostrar
 * "Error 409" en su lugar obligaria al usuario a abrir las herramientas del
 * navegador para entender que le pasa.
 */
export function describeHttpError(e: unknown): string {
  const err = e as { error?: { detail?: string }; status?: number } | null;
  if (err?.error?.detail) {
    return err.error.detail;
  }
  switch (err?.status) {
    case 403:
      return 'No tienes permisos para esta operación';
    case 404:
      return 'No encontrado';
    default:
      return 'No se pudo completar la operación';
  }
}
