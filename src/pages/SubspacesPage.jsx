import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Network, Plus, FolderTree, Folder } from 'lucide-react';

export default function SubspacesPage() {
  const { tenant } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  
  const [activeSpaceDetails, setActiveSpaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubspace, setNewSubspace] = useState({ name: '', type: 'company' });
  const [createMsg, setCreateMsg] = useState({ text: '', type: '' });
  const [creating, setCreating] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferChild, setTransferChild] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMsg, setTransferMsg] = useState({ text: '', type: '' });
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    if (activeSpaceId) {
      loadSpaceDetails(activeSpaceId);
    }
  }, [activeSpaceId]);

  const loadSpaces = async () => {
    try {
      const res = await api.get('/spaces');
      const list = res.data.spaces || res.data.data || res.data; 
      setSpaces(list);
      if (list.length > 0) {
        setActiveSpaceId(list[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Erro ao carregar seus espaços.');
      setLoading(false);
    }
  };

  const loadSpaceDetails = async (spaceId) => {
    setLoading(true);
    try {
      const res = await api.get(`/spaces/${spaceId}`);
      setActiveSpaceDetails(res.data.space);
    } catch (err) {
      setError('Erro ao carregar os dados do espaço.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg({ text: '', type: '' });
    try {
      await api.post(`/spaces`, {
        name: newSubspace.name,
        type: newSubspace.type,
        parent_space_id: activeSpaceId,
        organization_id: activeSpaceDetails?.organization_id
      });
      setCreateMsg({ text: 'Subgrupo criado com sucesso!', type: 'success' });
      setNewSubspace({ name: '', type: 'company' });
      setShowCreateModal(false);
      loadSpaceDetails(activeSpaceId); // recarrega a árvore
      loadSpaces(); // recarrega a lista global
    } catch (err) {
      setCreateMsg({ text: err.response?.data?.error || 'Erro ao criar subgrupo.', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferring(true);
    setTransferMsg({ text: '', type: '' });
    try {
      await api.post(`/spaces/${activeSpaceId}/transfer-credits`, {
        child_space_id: transferChild.id,
        amount: parseInt(transferAmount)
      });
      setTransferMsg({ text: 'Créditos transferidos com sucesso!', type: 'success' });
      setTransferAmount('');
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferChild(null);
      }, 1500);
    } catch (err) {
      setTransferMsg({ text: err.response?.data?.error || 'Erro ao transferir.', type: 'error' });
    } finally {
      setTransferring(false);
    }
  };

  if (loading && spaces.length === 0) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-brand-blue" /> Estrutura e Subgrupos
          </h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie a hierarquia, filiais e subprojetos do seu espaço.</p>
        </div>
        
        {spaces.length > 1 && (
          <select 
            value={activeSpaceId || ''} 
            onChange={(e) => setActiveSpaceId(e.target.value)}
            className="border-gray-300 rounded-lg text-sm bg-white shadow-sm"
          >
            {spaces.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
          </select>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

      {spaces.length === 0 ? (
        <div className="bg-amber-50 text-amber-800 p-6 rounded-lg text-center">
          Você ainda não possui um Espaço criado. Crie seu primeiro QR Code para gerar um Espaço.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
                <FolderTree className="w-12 h-12 text-brand-blue mb-3 opacity-80" />
                <h3 className="font-semibold text-gray-900">Hierarquia Vertical</h3>
                <p className="text-xs text-gray-500 mt-2 mb-4">
                  Você pode vincular novos grupos como "filhos" deste espaço. Ideal para controle de filiais, turmas, ou subprojetos.
                </p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white font-bold py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Criar Subgrupo
                </button>
             </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                   Visão em Árvore
                </h3>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-10"><div className="animate-spin inline-block w-6 h-6 border-b-2 border-brand-blue rounded-full"></div></div>
                ) : activeSpaceDetails ? (
                  <div className="space-y-3">
                    {/* Nó Pai */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <Folder className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-bold text-gray-900">{activeSpaceDetails.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{activeSpaceDetails.type}</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">Matriz / Grupo Principal</span>
                    </div>

                    {/* Nós Filhos */}
                    <div className="pl-8 border-l-2 border-gray-200 ml-4 space-y-3 mt-4">
                      {activeSpaceDetails.children?.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nenhum subgrupo vinculado.</p>
                      ) : (
                        activeSpaceDetails.children?.map(child => (
                          <div key={child.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-brand-blue transition">
                            <FolderTree className="w-4 h-4 text-gray-400" />
                            <div className="flex-1 cursor-pointer" onClick={() => setActiveSpaceId(child.id)}>
                              <p className="font-semibold text-gray-800">{child.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{child.type}</p>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransferChild(child);
                                setShowTransferModal(true);
                              }}
                              className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded hover:bg-green-200 transition"
                            >
                              Repassar Créditos
                            </button>
                            <span 
                              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded cursor-pointer"
                              onClick={() => setActiveSpaceId(child.id)}
                            >
                              Ver subgrupo &rarr;
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Novo Subgrupo</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <Network className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {createMsg.text && (
                <div className={`p-3 rounded-lg text-xs font-medium mb-4 ${createMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {createMsg.text}
                </div>
              )}
              <form onSubmit={handleCreateSubspace} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Subgrupo / Filial</label>
                  <input 
                    type="text" 
                    required 
                    value={newSubspace.name}
                    onChange={e => setNewSubspace({...newSubspace, name: e.target.value})}
                    placeholder="Ex: Filial Norte"
                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Espaço</label>
                  <select 
                    value={newSubspace.type}
                    onChange={e => setNewSubspace({...newSubspace, type: e.target.value})}
                    className="w-full text-sm border-gray-300 rounded-lg"
                  >
                    <option value="company">Empresa / Filial</option>
                    <option value="cause">Causa / Projeto</option>
                    <option value="family">Família / Turma</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={creating || !newSubspace.name}
                  className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white font-bold py-2 rounded-lg text-sm transition disabled:opacity-50 mt-2"
                >
                  {creating ? 'Criando...' : 'Confirmar Criação'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Repasse de Créditos */}
      {showTransferModal && transferChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Repassar Créditos</h2>
              <button onClick={() => { setShowTransferModal(false); setTransferChild(null); }} className="text-gray-400 hover:text-gray-600">
                <Network className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Quantos créditos do seu saldo você deseja alocar para o subgrupo <strong>{transferChild.name}</strong>?
              </p>
              {transferMsg.text && (
                <div className={`p-3 rounded-lg text-xs font-medium mb-4 ${transferMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {transferMsg.text}
                </div>
              )}
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade de QR Codes</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-brand-blue"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={transferring || !transferAmount || transferAmount < 1}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-sm transition disabled:opacity-50 mt-2"
                >
                  {transferring ? 'Repassando...' : 'Confirmar Repasse'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
