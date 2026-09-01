import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Users, UserPlus, Shield, UserX, UserCheck } from 'lucide-react';
import EmergencyContactsList from '../components/EmergencyContactsList';

import { apiError } from '../utils/apiError';

export default function TeamPage() {
  const { tenant } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });
  const [inviting, setInviting] = useState(false);

  const [spaceName, setSpaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editSpaceName, setEditSpaceName] = useState('');
  const [updatingSpace, setUpdatingSpace] = useState(false);

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    if (activeSpaceId) {
      const currentSpace = spaces.find(s => s.id == activeSpaceId);
      if (currentSpace) setEditSpaceName(currentSpace.name);
      loadMembers(activeSpaceId);
    }
  }, [activeSpaceId]);

  const loadSpaces = async () => {
    try {
      const res = await api.get('/spaces');
      const list = res.data.data || res.data; // ajusta conforme a response real
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

  const loadMembers = async (spaceId) => {
    setLoading(true);
    try {
      const res = await api.get(`/spaces/${spaceId}/members`);
      setMembers(res.data.members);
      setInviteMsg({ text: '', type: '' });
    } catch (err) {
      setError('Erro ao carregar equipe: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg({ text: '', type: '' });
    try {
      await api.post(`/spaces/${activeSpaceId}/members/invite`, {
        email: inviteEmail,
        role: inviteRole
      });
      setInviteMsg({ text: 'Convite enviado e aceito com sucesso.', type: 'success' });
      setInviteEmail('');
      loadMembers(activeSpaceId);
    } catch (err) {
      setInviteMsg({ text: err.response?.data?.error || 'Erro ao convidar.', type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/spaces', { type: 'company', name: spaceName });
      loadSpaces();
      setSuccess('Espaço criado com sucesso.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Erro ao criar espaço: ' + apiError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSpace = async (e) => {
    e.preventDefault();
    setUpdatingSpace(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/spaces/${activeSpaceId}`, { name: editSpaceName });
      setSuccess('Equipe renomeada com sucesso.');
      setTimeout(() => setSuccess(''), 5000);
      loadSpaces();
    } catch (err) {
      setError('Erro ao renomear: ' + apiError(err));
    } finally {
      setUpdatingSpace(false);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/spaces/${activeSpaceId}/members/${memberId}/role`, { role: newRole });
      loadMembers(activeSpaceId);
      setSuccess('Cargo alterado com sucesso.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Tem certeza que deseja remover este membro da equipe?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/spaces/${activeSpaceId}/members/${memberId}`);
      loadMembers(activeSpaceId);
      setSuccess('Membro removido com sucesso.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const roleLabels = {
    owner: 'Dono (Owner)',
    admin: 'Administrador',
    manager: 'Gerente',
    member: 'Membro Básico'
  };

  if (loading && spaces.length === 0) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-blue" /> Gestão de Equipe
          </h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie quem tem acesso aos QR Codes do seu Espaço.</p>
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
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg">{success}</div>}

      {spaces.length === 0 ? (
        <div className="bg-amber-50 text-amber-800 p-6 rounded-lg text-center space-y-4">
          <p>Você ainda não possui uma Empresa ou Equipe criada.</p>
          <form onSubmit={handleCreateSpace} className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            <input 
              type="text" 
              value={spaceName} 
              onChange={e => setSpaceName(e.target.value)} 
              placeholder="Nome da sua Equipe" 
              required
              className="border-gray-300 rounded-lg text-sm flex-1"
            />
            <button 
              type="submit" 
              disabled={creating || !spaceName}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {creating ? 'Criando...' : 'Criar'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lado Esquerdo: Convidar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-blue" /> Adicionar Membro
              </h3>
              
              {inviteMsg.text && (
                <div className={`p-3 rounded-lg text-xs font-medium mb-4 ${inviteMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {inviteMsg.text}
                </div>
              )}

              {/* Editar Nome do Espaço */}
              <div className="mb-6 pb-6 border-b">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Renomear Equipe</h4>
                <form onSubmit={handleUpdateSpace} className="flex gap-2">
                  <input 
                    type="text" 
                    value={editSpaceName} 
                    onChange={e => setEditSpaceName(e.target.value)} 
                    required
                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-brand-blue"
                  />
                  <button 
                    type="submit" 
                    disabled={updatingSpace || !editSpaceName}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-3 py-2 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </form>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-mail do usuário</label>
                  <input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="email@exemplo.com"
                    required
                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-brand-blue"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">O usuário já deve ter uma conta no sistema.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cargo / Permissão</label>
                  <select 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-lg bg-gray-50"
                  >
                    <option value="admin">Administrador (Pode gerenciar QRs e Membros)</option>
                    <option value="manager">Gerente (Pode criar QRs, não edita membros)</option>
                    <option value="member">Membro Básico (Apenas leitura/uso)</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={inviting || !inviteEmail}
                  className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white font-bold py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {inviting ? 'Adicionando...' : 'Adicionar ao Espaço'}
                </button>
              </form>
            </div>
            
            <div className="bg-gray-50 border rounded-xl p-5">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" /> Entenda os cargos
              </h4>
              <ul className="text-xs text-gray-600 space-y-3">
                <li><strong>Dono:</strong> Tem controle absoluto sobre o Espaço e seus créditos.</li>
                <li><strong>Admin:</strong> Pode usar créditos, gerar QR Codes, editar e convidar pessoas.</li>
                <li><strong>Manager:</strong> Pode configurar QR Codes mas tem bloqueio para dados financeiros.</li>
                <li><strong>Membro:</strong> Permissão básica para visualizar e ser vinculado a processos.</li>
              </ul>
            </div>
          </div>

          {/* Lado Direito: Lista de Membros */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-10 text-center"><div className="animate-spin inline-block w-6 h-6 border-b-2 border-brand-blue rounded-full"></div></div>
              ) : members.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Nenhum membro encontrado.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Usuário</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Cargo</th>
                      <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 font-medium text-gray-600 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{member.tenant?.name || 'Usuário Sem Nome'}</p>
                          <p className="text-xs text-gray-500">{member.tenant?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {member.role === 'owner' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                              <Shield className="w-3 h-3" /> Dono
                            </span>
                          ) : member.tenant?.id === tenant.id ? (
                            <span className="text-gray-700 font-medium">{roleLabels[member.role]}</span>
                          ) : (
                            <select 
                              value={member.role}
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                              className="text-xs border-gray-300 rounded py-1 pl-2 pr-6"
                            >
                              <option value="admin">Administrador</option>
                              <option value="manager">Gerente</option>
                              <option value="member">Membro Básico</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <UserCheck className="w-3 h-3" /> Ativo
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {member.role !== 'owner' && member.tenant?.id !== tenant.id && (
                            <button 
                              onClick={() => handleRemove(member.id)}
                              className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded transition"
                              title="Remover Membro"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seção de Contatos de Pânico */}
      {activeSpaceId && (
        <div className="mt-8">
          <EmergencyContactsList spaceId={activeSpaceId} />
        </div>
      )}
    </div>
  );
}
