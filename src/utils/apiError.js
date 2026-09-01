export function apiError(err) {
  return err?.data?.error || err?.message || 'Erro inesperado.';
}
