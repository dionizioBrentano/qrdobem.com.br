import { useState, useEffect } from 'react';
import { causeProductsApi } from '../services/api';
import { Plus, X, Edit, Trash2 } from 'lucide-react';

export default function CauseProductsBlock({ spaceId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '', purpose: '', unit: '', unit_price: '', platform_fee_pct: '',
    shipping_cost: '', other_costs: '', barcode: '', manufacturer: '',
    distributor: '', formula_keys: '', attributes: [], substitutes: []
  });

  const [quoteState, setQuoteState] = useState({});

  useEffect(() => {
    if (!spaceId) return;
    loadProducts();
  }, [spaceId]);

  const loadProducts = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await causeProductsApi.list(spaceId);
      setProducts(res.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({
      name: '', purpose: '', unit: '', unit_price: '', platform_fee_pct: '',
      shipping_cost: '', other_costs: '', barcode: '', manufacturer: '',
      distributor: '', formula_keys: '', attributes: [], substitutes: []
    });
    setFormOpen(true);
    setError('');
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      purpose: product.purpose || '',
      unit: product.unit || '',
      unit_price: product.unit_price || '',
      platform_fee_pct: product.platform_fee_pct || '',
      shipping_cost: product.shipping_cost || '',
      other_costs: product.other_costs || '',
      barcode: product.barcode || '',
      manufacturer: product.manufacturer || '',
      distributor: product.distributor || '',
      formula_keys: product.formula_keys ? product.formula_keys.join(', ') : '',
      attributes: product.attributes || [],
      substitutes: product.substitutes || [],
    });
    setFormOpen(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    setError('');
    try {
      await causeProductsApi.remove(spaceId, id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = {
      ...form,
      unit_price: form.unit_price === '' ? null : Number(form.unit_price),
      platform_fee_pct: form.platform_fee_pct === '' ? null : Number(form.platform_fee_pct),
      shipping_cost: form.shipping_cost === '' ? null : Number(form.shipping_cost),
      other_costs: form.other_costs === '' ? null : Number(form.other_costs),
      formula_keys: form.formula_keys ? form.formula_keys.split(',').map(s => s.trim()).filter(Boolean) : [],
    };

    try {
      if (editingId) {
        await causeProductsApi.update(spaceId, editingId, payload);
      } else {
        await causeProductsApi.create(spaceId, payload);
      }
      setFormOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuote = async (productId) => {
    const qty = quoteState[productId]?.qty || 1;
    try {
      const res = await causeProductsApi.quote(spaceId, productId, qty);
      setQuoteState(prev => ({
        ...prev,
        [productId]: { ...prev[productId], result: res.quote }
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const addAttribute = () => setForm(p => ({ ...p, attributes: [...p.attributes, { attr_key: '', attr_value: '', significance: 'financeiro' }] }));
  const updateAttribute = (idx, field, val) => {
    const updated = [...form.attributes];
    updated[idx][field] = val;
    setForm(p => ({ ...p, attributes: updated }));
  };
  const removeAttribute = (idx) => setForm(p => ({ ...p, attributes: p.attributes.filter((_, i) => i !== idx) }));

  const addSubstitute = () => setForm(p => ({ ...p, substitutes: [...p.substitutes, { substitute_id: '', reason: 'falta', qty_equivalent: '' }] }));
  const updateSubstitute = (idx, field, val) => {
    const updated = [...form.substitutes];
    updated[idx][field] = val;
    setForm(p => ({ ...p, substitutes: updated }));
  };
  const removeSubstitute = (idx) => setForm(p => ({ ...p, substitutes: p.substitutes.filter((_, i) => i !== idx) }));

  if (loading) return <div className="py-4 text-gray-500">Carregando produtos...</div>;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Produtos desta causa</h2>
        {!formOpen && (
          <button onClick={handleOpenNew} className="text-sm bg-brand-blue text-white px-3 py-1.5 rounded flex items-center gap-1 font-medium">
            <Plus className="w-4 h-4" /> Novo
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      {formOpen ? (
        <form onSubmit={handleSave} className="space-y-4 border border-gray-200 rounded p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Nome *</span>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Finalidade *</span>
              <input type="text" required value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Unidade *</span>
              <input type="text" required value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="w-full border p-2 rounded mt-1 placeholder-gray-400" placeholder="Ex: Cesta, Kg" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Preço Unitário (R$) *</span>
              <input type="number" step="0.01" required value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Taxa Plataforma (%)</span>
              <input type="number" step="0.01" value={form.platform_fee_pct} onChange={e => setForm(p => ({ ...p, platform_fee_pct: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Custo Frete (R$)</span>
              <input type="number" step="0.01" value={form.shipping_cost} onChange={e => setForm(p => ({ ...p, shipping_cost: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Outros Custos (R$)</span>
              <input type="number" step="0.01" value={form.other_costs} onChange={e => setForm(p => ({ ...p, other_costs: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Código de Barras</span>
              <input type="text" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Fabricante</span>
              <input type="text" value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700 font-medium">Distribuidor</span>
              <input type="text" value={form.distributor} onChange={e => setForm(p => ({ ...p, distributor: e.target.value }))} className="w-full border p-2 rounded mt-1" />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="text-gray-700 font-medium">Chaves de Fórmula (separado por vírgula)</span>
              <input type="text" value={form.formula_keys} onChange={e => setForm(p => ({ ...p, formula_keys: e.target.value }))} placeholder="Ex: extra_embalagem, seguro" className="w-full border p-2 rounded mt-1" />
            </label>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">Atributos</span>
              <button type="button" onClick={addAttribute} className="text-xs text-brand-blue font-medium">+ Atributo</button>
            </div>
            {form.attributes.map((attr, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <input type="text" placeholder="Chave" required value={attr.attr_key} onChange={e => updateAttribute(idx, 'attr_key', e.target.value)} className="w-1/3 border p-1 rounded text-sm" />
                <input type="text" placeholder="Valor" required value={attr.attr_value} onChange={e => updateAttribute(idx, 'attr_value', e.target.value)} className="w-1/3 border p-1 rounded text-sm" />
                <select value={attr.significance} onChange={e => updateAttribute(idx, 'significance', e.target.value)} className="w-1/3 border p-1 rounded text-sm bg-white">
                  <option value="financeiro">Financeiro</option>
                  <option value="identidade">Identidade</option>
                  <option value="apresentacao">Apresentação</option>
                  <option value="comercial">Comercial</option>
                  <option value="logistica">Logística</option>
                  <option value="uso">Uso</option>
                </select>
                <button type="button" onClick={() => removeAttribute(idx)} className="text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">Produtos Similares</span>
              <button type="button" onClick={addSubstitute} className="text-xs text-brand-blue font-medium">+ Similar</button>
            </div>
            {form.substitutes.map((sub, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                <select required value={sub.substitute_id} onChange={e => updateSubstitute(idx, 'substitute_id', e.target.value)} className="w-1/3 border p-1 rounded text-sm bg-white">
                  <option value="">Selecione...</option>
                  {products.filter(p => p.id !== editingId).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select required value={sub.reason} onChange={e => updateSubstitute(idx, 'reason', e.target.value)} className="w-1/4 border p-1 rounded text-sm bg-white">
                  <option value="falta">Falta</option>
                  <option value="preco">Preço</option>
                  <option value="finalidade">Finalidade</option>
                </select>
                <input type="number" step="0.01" placeholder="Qtd. Equivalente" value={sub.qty_equivalent} onChange={e => updateSubstitute(idx, 'qty_equivalent', e.target.value)} className="w-1/4 border p-1 rounded text-sm" />
                <button type="button" onClick={() => removeSubstitute(idx)} className="text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="bg-emerald-600 text-white font-bold px-4 py-2 rounded">
              Salvar Produto
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum produto cadastrado.</p>
          ) : (
            <div className="grid gap-4">
              {products.map(product => (
                <div key={product.id} className="border border-gray-200 rounded p-4 flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-600">{product.purpose} ({product.unit})</p>
                    <p className="text-sm font-medium text-brand-blue mt-1">
                      R$ {Number(product.unit_price).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        min="1" 
                        value={quoteState[product.id]?.qty || 1} 
                        onChange={e => setQuoteState(p => ({ ...p, [product.id]: { ...p[product.id], qty: e.target.value } }))}
                        className="w-16 border rounded p-1 text-sm text-center mb-1" 
                        placeholder="Qtd"
                      />
                      <button onClick={() => handleQuote(product.id)} className="text-xs font-bold bg-gray-200 px-2 py-1 rounded">Cotar</button>
                    </div>
                    
                    {quoteState[product.id]?.result && (
                      <div className="text-xs bg-white border p-2 rounded shadow-sm w-32">
                        <div className="flex justify-between"><span>Bens:</span> <span>{quoteState[product.id].result.goods}</span></div>
                        <div className="flex justify-between"><span>Taxa:</span> <span>{quoteState[product.id].result.platform_fee}</span></div>
                        <div className="flex justify-between font-bold mt-1 border-t pt-1">
                          <span>Total:</span> <span>R$ {quoteState[product.id].result.total}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-auto">
                    <button onClick={() => handleEdit(product)} className="p-2 text-gray-600 hover:bg-gray-200 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
