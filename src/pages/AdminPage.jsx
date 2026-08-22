import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const { tenant } = useAuth();
  const [data, setData] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingMsg, setPricingMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [batchForm, setBatchForm] = useState({ 
    mode: 'quantity', // 'quantity' or 'value'
    inputValue: '', 
    organization_id: '',
    expires_at: ''
  });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMsg, setBatchMsg] = useState({ text: '', type: '' });

  if (!tenant || tenant.role !== 'superadmin') {
    return <Navigate to="/painel" replace />;
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const [res, pricingRes] = await Promise.all([
        adminApi.getTenants(),
        adminApi.getPricing()
      ]);
      setData(res);
      setPricing(pricingRes);
      // Se tiver um tenant selecionado, atualiza ele com os novos dados
      if (selectedTenant) {
        const updated = res.tenants.find(t => t.id === selectedTenant.id);
        if (updated) setSelectedTenant(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unitPrice = data?.metrics?.pricing?.unit_price || 0.50; // Fallback se não configurado

  const calculatedAmount = () => {
    if (batchForm.mode === 'quantity') {
      return Number(batchForm.inputValue) || 0;
    } else {
      const val = parseFloat(batchForm.inputValue.replace(',', '.'));
      return isNaN(val) ? 0 : Math.floor(val / unitPrice);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const amount = calculatedAmount();
    if (amount < 1) {
      setBatchMsg({ text: 'A quantidade final deve ser pelo menos 1.', type: 'error' });
      return;
    }

    setBatchLoading(true);
    setBatchMsg({ text: '', type: '' });
    try {
      await adminApi.createBatch({
        tenant_id: selectedTenant.id,
        organization_id: batchForm.organization_id ? Number(batchForm.organization_id) : null,
        amount: amount,
        expires_at: batchForm.expires_at || null,
        note: batchForm.mode === 'value' ? `Atribuição financeira: R$ ${batchForm.inputValue}` : 'Atribuição por quantidade'
      });
      setBatchMsg({ text: 'Créditos atribuídos com sucesso!', type: 'success' });
      setBatchForm({ mode: 'quantity', inputValue: '', organization_id: '', expires_at: '' });
      loadTenants();
    } catch (err) {
      setBatchMsg({ text: err.data?.error || err.message, type: 'error' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setPricingLoading(true);
    setPricingMsg('');
    try {
      const payload = {
        unit_price: Number(pricing.unit_price) || 0,
        min_quantity: Number(pricing.min_quantity) || 0,
        max_quantity: Number(pricing.max_quantity) || 0,
        adventure_yearly_price: Number(pricing.adventure_yearly_price) || 0,
        family_pack_qty: Number(pricing.family_pack_qty) || 0,
        family_pack_price: Number(pricing.family_pack_price) || 0,
        launch_offer_enabled: Boolean(pricing.launch_offer?.enabled),
        launch_offer_discount_percent: Number(pricing.launch_offer?.discount_percent) || 0,
        launch_offer_ends_at: pricing.launch_offer?.ends_at || null,
      };
      
      const res = await adminApi.updatePricing(payload);
      setPricing(res.pricing);
      setPricingMsg('Preços salvos com sucesso!');
      setTimeout(() => setPricingMsg(''), 3000);
    } catch (err) {
      setPricingMsg(err.data?.error || err.message);
    } finally {
      setPricingLoading(false);
    }
  };

  if (loading && !data) {
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

      {/* Avisos de segurança */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-amber-800">⚠ Ações necessárias antes de abrir para registros</h2>
        <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
          <li><strong>APP_DEBUG=true</strong> — Desative no .env do servidor.</li>
          <li><strong>Credenciais compartilhadas</strong> — DB_PASSWORD e MAIL_PASSWORD são iguais. Crie senhas separadas.</li>
        </ul>
      </div>

      {/* Métricas */}
      {data?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Tenants ativos</p>
            <p className="text-3xl font-bold text-brand-blue">{data.metrics.total_tenants}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Total de QR Codes</p>
            <p className="text-3xl font-bold text-gray-900">{data.metrics.total_qrs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Preço Base QR (Efetivo)</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {parseFloat(pricing?.unit_price_effective || unitPrice).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Engajamento</p>
            <p className="text-3xl font-bold text-brand-blue">{data.metrics.engagement}</p>
          </div>
        </div>
      )}

      {/* Preços e Configurações */}
      {pricing && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Preços & Ofertas</h2>
            {pricingMsg && (
              <span className={`text-sm ${pricingMsg.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                {pricingMsg}
              </span>
            )}
          </div>
          <form onSubmit={handleSavePricing} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Créditos Avulsos */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700">QR Codes Avulsos</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preço Base (R$)</label>
                <input
                  type="number" step="0.01"
                  value={pricing.unit_price}
                  onChange={e => setPricing({...pricing, unit_price: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qtd Mínima</label>
                  <input
                    type="number"
                    value={pricing.min_quantity}
                    onChange={e => setPricing({...pricing, min_quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qtd Máxima</label>
                  <input
                    type="number"
                    value={pricing.max_quantity}
                    onChange={e => setPricing({...pricing, max_quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Aventura e Família */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700">Aventura & Pacotes</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assinatura Anual Aventura (R$)</label>
                <input
                  type="number" step="0.01"
                  value={pricing.adventure_yearly_price}
                  onChange={e => setPricing({...pricing, adventure_yearly_price: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qtd Pacote Família</label>
                  <input
                    type="number"
                    value={pricing.family_pack_qty}
                    onChange={e => setPricing({...pricing, family_pack_qty: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Preço Pacote (R$)</label>
                  <input
                    type="number" step="0.01"
                    value={pricing.family_pack_price}
                    onChange={e => setPricing({...pricing, family_pack_price: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Oferta de Lançamento */}
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100 relative">
              {pricing.launch_offer?.active && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ATIVA
                </span>
              )}
              <h3 className="font-semibold text-blue-900">Oferta de Lançamento</h3>
              <label className="flex items-center gap-2 text-sm text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricing.launch_offer?.enabled || false}
                  onChange={e => setPricing({
                    ...pricing,
                    launch_offer: { ...pricing.launch_offer, enabled: e.target.checked }
                  })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Habilitar Oferta
              </label>
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Desconto (%)</label>
                <input
                  type="number" step="0.01"
                  value={pricing.launch_offer?.discount_percent || ''}
                  onChange={e => setPricing({
                    ...pricing,
                    launch_offer: { ...pricing.launch_offer, discount_percent: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Até (Data Limite)</label>
                <input
                  type="date"
                  value={pricing.launch_offer?.ends_at || ''}
                  onChange={e => setPricing({
                    ...pricing,
                    launch_offer: { ...pricing.launch_offer, ends_at: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                />
              </div>
              {pricing.launch_offer?.enabled && (
                <p className="text-xs text-blue-800 font-medium bg-blue-100 p-2 rounded">
                  Valor com Desconto (Ex): R$ {parseFloat(pricing.unit_price_effective || 0).toFixed(2)} / QR
                </p>
              )}
            </div>
            
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={pricingLoading}
                className="bg-brand-blue hover:bg-brand-blue-strong text-white px-6 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                {pricingLoading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de tenants */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Papel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">QRs Usados</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Créditos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.tenants?.map((t) => (
              <tr 
                key={t.id} 
                onClick={() => { setSelectedTenant(t); setBatchMsg({text: '', type: ''}); }}
                className="hover:bg-gray-50 cursor-pointer transition"
              >
                <td className="px-4 py-3 text-gray-500">#{t.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.email || '-'}</td>
                <td className="px-4 py-3 capitalize">{t.role}</td>
                <td className="px-4 py-3 text-gray-600">{t.used}</td>
                <td className="px-4 py-3 font-bold text-brand-blue">{t.credits_available}</td>
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

      {/* Modal de Detalhes do Tenant */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestão do Associado</h2>
                <p className="text-sm text-gray-500">{selectedTenant.name} ({selectedTenant.email})</p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              {/* Esquerda: Histórico Financeiro */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Situação Financeira</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium">Saldo Direto (CPF/Grupo)</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedTenant.direct_credits || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 font-medium">Saldo em Empresas (CNPJ)</p>
                      <p className="text-2xl font-bold text-green-900">
                        {(selectedTenant.credits_available || 0) - (selectedTenant.direct_credits || 0)}
                      </p>
                    </div>
                  </div>

                  {selectedTenant.organizations?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Empresas (CNPJs) Vinculadas:</p>
                      <ul className="space-y-2">
                        {selectedTenant.organizations.map(org => (
                          <li key={org.id} className="text-sm bg-gray-50 p-2 rounded border flex justify-between">
                            <span>🏢 {org.name} <span className="text-gray-400 text-xs">({org.document || 'Sem CNPJ'})</span></span>
                            <span className="font-bold">{org.credits_available} QRs</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-sm font-medium text-gray-700 mb-2 mt-4">Histórico de Lotes:</p>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-2">Data</th>
                          <th className="p-2">Destino</th>
                          <th className="p-2">Disp/Total</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedTenant.credit_batches?.length === 0 ? (
                          <tr><td colSpan="4" className="p-4 text-center text-gray-500">Nenhum lote encontrado.</td></tr>
                        ) : (
                          selectedTenant.credit_batches?.map(b => (
                            <tr key={b.id} className="hover:bg-gray-50">
                              <td className="p-2 text-gray-600">{new Date(b.created_at).toLocaleDateString()}</td>
                              <td className="p-2 font-medium">
                                {b.organization_id ? `CNPJ (Org #${b.organization_id})` : 'CPF (Direto)'}
                              </td>
                              <td className="p-2">{b.amount_available} / {b.amount_total}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Direita: Atribuir Créditos */}
              <div className="w-full lg:w-80 bg-gray-50 p-5 rounded-xl border h-fit">
                <h3 className="font-semibold text-gray-900 mb-4">Atribuir Créditos</h3>
                
                {batchMsg.text && (
                  <div className={`p-3 rounded-lg text-sm mb-4 ${batchMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {batchMsg.text}
                  </div>
                )}

                <form onSubmit={handleCreateBatch} className="space-y-4">
                  
                  {/* Tipo de atribuição */}
                  <div className="flex bg-gray-200 p-1 rounded-lg">
                    <button 
                      type="button" 
                      onClick={() => setBatchForm({...batchForm, mode: 'quantity'})}
                      className={`flex-1 text-sm py-1.5 rounded-md transition ${batchForm.mode === 'quantity' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Por Quantidade
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setBatchForm({...batchForm, mode: 'value'})}
                      className={`flex-1 text-sm py-1.5 rounded-md transition ${batchForm.mode === 'value' ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Por Valor (R$)
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {batchForm.mode === 'quantity' ? 'Quantidade de QR Codes' : 'Valor depositado (R$)'}
                    </label>
                    <input
                      type={batchForm.mode === 'quantity' ? 'number' : 'text'}
                      placeholder={batchForm.mode === 'quantity' ? 'Ex: 100' : 'Ex: 50.00'}
                      value={batchForm.inputValue}
                      onChange={(e) => setBatchForm({ ...batchForm, inputValue: e.target.value })}
                      required
                      min={batchForm.mode === 'quantity' ? "1" : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue"
                    />
                    {batchForm.mode === 'value' && batchForm.inputValue && (
                      <p className="text-xs text-brand-blue mt-1 font-medium">
                        Convertido: {calculatedAmount()} QRs (Base: R$ {parseFloat(unitPrice).toFixed(2)})
                      </p>
                    )}
                  </div>

                  {selectedTenant.organizations?.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Empresa Destino (Opcional)</label>
                      <select
                        value={batchForm.organization_id}
                        onChange={(e) => setBatchForm({ ...batchForm, organization_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Deixar no CPF (Uso Pessoal)</option>
                        {selectedTenant.organizations.map(org => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                        Se escolher uma empresa, o crédito fica bloqueado para uso exclusivo do CNPJ dela.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Validade (Opcional)</label>
                    <input
                      type="date"
                      value={batchForm.expires_at}
                      onChange={(e) => setBatchForm({ ...batchForm, expires_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={batchLoading || calculatedAmount() < 1}
                    className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                  >
                    {batchLoading ? 'Processando...' : `Atribuir ${calculatedAmount()} QRs`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
