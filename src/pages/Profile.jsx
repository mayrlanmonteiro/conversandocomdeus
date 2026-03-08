import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import { User, Mail, Calendar, Save, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import './Profile.css';

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(null);
    const [messageCount, setMessageCount] = useState(0);
    const [profile, setProfile] = useState({
        full_name: '',
        email: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        async function getProfile() {
            try {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    navigate('/login');
                    return;
                }

                const { user } = session;
                setUser(user);
                setProfile({
                    full_name: user.user_metadata?.full_name || '',
                    email: user.email
                });

                // Contar mensagens para as estatísticas
                const { count, error: countError } = await supabase
                    .from('chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!countError) setMessageCount(count || 0);

            } catch (error) {
                console.error('Erro ao carregar perfil:', error);
            } finally {
                setLoading(false);
            }
        }

        getProfile();
    }, [navigate]);

    async function updateProfile(e) {
        e.preventDefault();
        try {
            setUpdating(true);
            setStatus({ type: '', message: '' });

            const { error } = await supabase.auth.updateUser({
                data: { full_name: profile.full_name }
            });

            if (error) throw error;

            setStatus({ type: 'success', message: 'Perfil atualizado com sucesso!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="profile-page">
                <Header />
                <div className="profile-container" style={{ textAlign: 'center', marginTop: '100px' }}>
                    <p>Carregando sua jornada...</p>
                </div>
            </div>
        );
    }

    const firstLetter = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

    return (
        <div className="profile-page">
            <Header />

            <main className="profile-container">
                <div className="profile-card">
                    <div className="profile-cover"></div>

                    <div className="profile-header">
                        <div className="profile-avatar-wrapper">
                            <div className="profile-avatar">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" />
                                ) : (
                                    <span>{firstLetter}</span>
                                )}
                            </div>
                        </div>

                        <div className="profile-info">
                            <h2>{profile.full_name || 'Irmão(ã) em Cristo'}</h2>
                            <p className="profile-email">{user.email}</p>
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{messageCount}</span>
                                <span className="stat-label">Mensagens</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">
                                    {new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                </span>
                                <span className="stat-label">Desde</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-content">
                        <section className="profile-section">
                            <h3 className="section-title">
                                <User size={20} />
                                Informações Pessoais
                            </h3>

                            {status.message && (
                                <div className={`status-message ${status.type}`} style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem',
                                    backgroundColor: status.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                                    color: status.type === 'success' ? '#059669' : '#B91C1C',
                                    border: `1px solid ${status.type === 'success' ? '#A7F3D0' : '#FEE2E2'}`
                                }}>
                                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    {status.message}
                                </div>
                            )}

                            <form className="profile-form" onSubmit={updateProfile}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nome Completo</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                placeholder="Como gostaria de ser chamado?"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>E-mail (Privado)</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate('/chat')}
                                    >
                                        Voltar ao Chat
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-save"
                                        disabled={updating}
                                    >
                                        {updating ? 'Salvando...' : (
                                            <>
                                                <Save size={18} />
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
