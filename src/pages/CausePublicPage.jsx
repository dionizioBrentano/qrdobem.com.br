import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HeartHandshake, MapPin, ShieldCheck, Heart, Users } from 'lucide-react';
import { causesApi, donationsApi } from '../services/api';
import PublicShell from '../components/layout/PublicShell';

/**
 * CausePublicPage — vitrine pública de uma causa.
 * Fase 3, T2-R04 e T2-R05 do PLANO_TRILHAS_2026-08.md.
 *
 * A trilha existe para arrecadação COM prestação de contas. Por isso esta
 * página sempre mostra os dois lados juntos: quanto entrou e o que foi
 * feito com o dinheiro. Vitrine que só pede doação, sem provar resultado,
 * é o oposto do que o requisito pede.
 *
 * Rota pública: quem vê ainda não é usuário do sistema.
 */
export default function CausePublicPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    causesApi.show(slug)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Causa não encontrada.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    // "Quem apoia esta causa": só quem doou (pago) E não optou por anonimato
    // — a lista vem pronta do backend, que já esconde e-mail e anônimos.
    // Nunca inventamos apoiadores: se ninguém optou por aparecer, a seção
    // simplesmente não é renderizada.
    donationsApi.publicList(slug)
      .then((res) => { if (!cancelled) setSupporters(res.donations || []); })
      .catch(() => { if (!cancelled) setSupporters([]); });

    return () => { cancelled = true; };
  }, [slug]);

  const money = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <PublicShell>
        <div className="bg-gray-50 flex-1 flex items-center justify-center text-gray-500 w-full">Carregando...</div>
      </PublicShell>
    );
  }

  if (error || !data) {
    return (
      <PublicShell>
        <div className="bg-gray-50 flex-1 flex flex-col items-center justify-center p-6 text-center w-full">
          <p className="text-gray-700 mb-4">{error || 'Causa não encontrada.'}</p>
          <Link to="/" className="text-brand-blue underline">Voltar ao início</Link>
        </div>
      </PublicShell>
    );
  }

  const { cause, media, umbrella } = data;

  return (
    <PublicShell>
      <div className="bg-gray-50 flex-1 w-full">
      <div className="max-w-3xl mx-auto p-4 space-y-4 pt-8">

        <header className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-2 text-brand-blue mb-2">
            <HeartHandshake className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">
              {cause.category || 'Causa social'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-gray-900">{cause.name}</h1>
          <p className="text-gray-700 mt-1">{cause.headline}</p>

          {(cause.city || cause.state) && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {[cause.city, cause.state].filter(Boolean).join(' — ')}
            </p>
          )}
        </header>

        {/* Guarda-chuva: o doador precisa saber por qual entidade sai o
            recibo, porque é dela que vem a dedutibilidade fiscal. */}
        {umbrella && (
          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900 flex gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>
              Projeto apoiado por <strong>{umbrella.name}</strong>. O recibo é
              emitido pela entidade certificada.
            </span>
          </section>
        )}

        {cause.story && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-2">A história</h2>
            <p className="text-gray-700 whitespace-pre-line">{cause.story}</p>
          </section>
        )}

        {/* Prestação de contas — a razão de ser da trilha. */}
        {cause.accountability && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-2">Prestação de contas</h2>
            <p className="text-gray-700 whitespace-pre-line">{cause.accountability}</p>
          </section>
        )}

        {/* Prova social. Só mídia aprovada chega aqui — a moderação é
            feita no backend, e o frontend não tem como burlar. */}
        {media?.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-3">Resultados</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {media.map((item) => (
                <figure key={item.id} className="space-y-1">
                  {item.is_video ? (
                    <video src={item.url} controls className="w-full rounded-lg" />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || 'Resultado da causa'}
                      loading="lazy"
                      className="w-full rounded-lg object-cover aspect-square"
                    />
                  )}
                  {item.caption && (
                    <figcaption className="text-xs text-gray-500">{item.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Números. Só mostra barra de progresso quando há meta declarada:
            nem toda causa trabalha com meta fechada, e barra sem meta seria
            inventada. */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Arrecadado</p>
              <p className="text-3xl font-black text-brand-blue">{money(cause.raised_amount)}</p>
            </div>
            {cause.goal_amount && (
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Meta</p>
                <p className="text-lg font-bold text-gray-700">{money(cause.goal_amount)}</p>
              </div>
            )}
          </div>

          {cause.progress !== null && cause.progress !== undefined && (
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-brand-blue h-3 rounded-full transition-all"
                style={{ width: `${cause.progress}%` }}
              />
            </div>
          )}

          {/* CTA de doação. Leva ao fluxo de doar já com a causa selecionada;
              lá o doador vê o rateio (taxa 12% + destino) antes de confirmar. */}
          <Link
            to={`/doacoes?causa=${slug}`}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-strong text-white font-black py-3 rounded-lg transition"
          >
            <Heart className="w-5 h-5" />
            Doar para esta causa
          </Link>
        </section>

        {/* Quem apoia esta causa — só doadores pagos que autorizaram exibição.
            A lista vem do backend sem e-mail e sem anônimos. */}
        {supporters.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-blue" />
              Quem apoia esta causa
            </h2>
            <ul className="space-y-2">
              {supporters.map((s, index) => (
                <li
                  key={index}
                  className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{s.name}</p>
                    {s.message && (
                      <p className="text-xs text-gray-500 truncate">{s.message}</p>
                    )}
                  </div>
                  <span className="font-bold text-brand-blue shrink-0">{money(s.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="text-center mt-6">
          <Link to="/causas" className="text-brand-blue underline font-bold">
            Voltar
          </Link>
        </div>

        </div>
      </div>
    </PublicShell>
  );
}
