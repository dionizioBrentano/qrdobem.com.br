const VIA_CEP_URL = 'https://viacep.com.br/ws';

export async function lookupCep(cepDigits) {
  if (!cepDigits) return null;
  const cep = cepDigits.replace(/\D/g, '');
  if (cep.length !== 8) return null;

  try {
    const res = await fetch(`${VIA_CEP_URL}/${cep}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch (error) {
    return null;
  }
}
