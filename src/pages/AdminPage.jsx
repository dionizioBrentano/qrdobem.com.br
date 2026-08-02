import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const { tenant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchForm, setBatchForm] = useState({ organization_id: '', amount: '' });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMsg, setBatchMsg] = useState('');

  if (!tenant || tenant.role !== 'superadmin') {
    return <Navigate to="/painel" replace />;
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const res = await adminApi.getTenants();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setBatchLoading(true);
    setBatchMsg('');
    try {
      await adminApi.createBatch({
        organization_id: Number(batchForm.organization_id),
        amount: Number(batchForm.amount),
      });
      setBatchMsg('Lote criado com sucesso!');
      setBatchForm({ organization_id: '', amount: '' });
      loadTenants();
    } catch (err) {
      setBatchMsg(err.data?.error || err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>

      {/* Avisos de segurança para o administrador */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-amber-800">⚠ Ações necessárias antes de abrir para registros</h2>
        <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
          <li><strong>APP_DEBUG=true</strong> — Desative no .env do servidor (mude para <code className="bg-amber-100 px-1 rounded">false</code>) antes de abrir ao público. Debug ativo expõe stack traces e dados internos.</li>
          <li><strong>Credenciais compartilhadas</strong> — DB_PASSWORD e MAIL_PASSWORD são iguais. Crie senhas separadas para cada serviço.</li>
          <li><strong>APP_ENV=local</strong> — Mude para <code className="bg-amber-100 px-1 rounded">production</code> no .env do servidor.</li>
        </ul>
      </div>

      {/* Métricas */}
      {data?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Tenants ativos</p>
            <p className="text-3xl font-bold text-brand-blue">{data.metrics.total_tenants}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Total de QR Codes</p>
            <p className="text-3xl font-bold text-gray-900">{data.metrics.total_qrs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Engajamento</p>
            <p className="text-3xl font-bold text-brand-blue">{data.metrics.engagement}</p>
          </div>
        </div>
      )}

      {/* Criar lote de créditos */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold mb-4">Criar Lote de Créditos</h2>
        {batchMsg && (
          <div className={`px-4 py-2 rounded-lg mb-3 text-sm ${
            batchMsg.includes('sucesso') ? 'bg-brand-blue/10 text-brand-blue' : 'bg-red-50 text-red-700'
          }`}>
            {batchMsg}
          </div>
        )}
        <form onSubmit={handleCreateBatch} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ID da Organização</label>
            <input
              type="number"
              value={batchForm.organization_id}
              onChange={(e) => setBatchForm({ ...batchForm, organization_id: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg w-40 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
            <input
              type="number"
              value={batchForm.amount}
              onChange={(e) => setBatchForm({ ...batchForm, amount: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg w-32 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={batchLoading}
            className="bg-brand-blue hover:brightness-90 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {batchLoading ? 'Criando...' : 'Criar Lote'}
          </button>
        </form>
      </div>

      {/* Tabela de tenants */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Papel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cota</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usados</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.tenants?.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{t.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 capitalize">{t.role}</td>
                <td className="px-4 py-3">{t.quota}</td>
                <td className="px-4 py-3">{t.used}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-brand-blue/20 text-brand-blue' : 'bg-red-100 text-red-700'
                  }`}>
                    {t.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
