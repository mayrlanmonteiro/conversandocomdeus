import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import { 
    User, Mail, Calendar, Save, CheckCircle, AlertCircle, 
    MessageSquare, Bookmark, Trash2, Heart, Sparkles, 
    ChevronRight, Book, Clock, Settings, Edit3
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(null);
    const [messageCount, setMessageCount] = useState(0);
    const [profile, setProfile] = useState({
        full_name: '',
        email: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [bookmarks, setBookmarks] = useState([]);

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

                // Carregar contagem de mensagens
                const { count, error: countError } = await supabase
                    .from('chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!countError) setMessageCount(count || 0);

                // Carregar favoritos
                const { data: bookmarkData, error: bookmarkError } = await supabase
                    .from('bookmarks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (!bookmarkError) setBookmarks(bookmarkData || []);

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

    async function removeBookmark(id) {
        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', id);

        if (!error) {
            setBookmarks(bookmarks.filter(b => b.id !== id));
        }
    }

    const scrollToEdit = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="profile-page">
                <Header />
                <div className="profile-loading">
                    <div className="spinner-premium"></div>
                    <p>Carregando sua jornada espiritual...</p>
                </div>
            </div>
        );
    }

    const firstLetter = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase();

    return (
        <div className="profile-page">
            <Header />

            <main className="profile-wrapper">
                <div className="profile-card-premium">
                    {/* COVER E AVATAR */}
                    <div className="profile-hero">
                        <div className="profile-cover-gradient">
                            <div className="cover-particles"></div>
                        </div>
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-premium">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" />
                                ) : (
                                    <span>{firstLetter}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CABEÇALHO DE INFO */}
                    <div className="profile-header-premium">
                        <div className="profile-main-info">
                            <h1>{profile.full_name || 'Irmão(ã) em Cristo'}</h1>
                            <p className="p-email">{user.email}</p>
                            <p className="p-member-since">
                                Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        
                        <div className="profile-header-actions">
                            <button className="btn-edit-shortcut" onClick={scrollToEdit}>
                                <Edit3 size={18} />
                                <span>Editar Perfil</span>
                            </button>
                        </div>
                    </div>

                    {/* CARDS DE ESTATÍSTICAS */}
                    <div className="profile-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-box blue">
                                <MessageSquare size={20} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-num">{messageCount}</span>
                                <span className="stat-txt">Mensagens</span>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon-box gold">
                                <Heart size={20} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-num">{bookmarks.length}</span>
                                <span className="stat-txt">Favoritos</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-box purple">
                                <Calendar size={20} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-num">
                                    {new Date(user.created_at).getFullYear()}
                                </span>
                                <span className="stat-txt">Desde</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-sections-container">
                        {/* FAVORITOS */}
                        <section className="p-section">
                            <div className="section-header">
                                <div className="section-title-group">
                                    <Heart className="title-icon" size={22} />
                                    <h2>Conselhos e Orações Favoritas</h2>
                                </div>
                                <p className="section-desc">
                                    Aqui aparecem os conselhos e orações que você marcou com estrela nas conversas.
                                </p>
                            </div>

                            {bookmarks.length === 0 ? (
                                <div className="empty-state-card">
                                    <div className="empty-icon-circle">
                                        <Bookmark size={32} />
                                    </div>
                                    <h3>Nenhum conselho salvo ainda</h3>
                                    <p>Vá ao chat e clique no ícone de estrela ao lado de uma resposta para guardá-la aqui.</p>
                                    <button className="btn-go-chat" onClick={() => navigate('/chat')}>
                                        Começar conversa
                                    </button>
                                </div>
                            ) : (
                                <div className="favorites-list">
                                    {bookmarks.map((bookmark) => (
                                        <div key={bookmark.id} className="fav-card-modern">
                                            <div className="fav-body">
                                                <Quote size={24} className="fav-quote-icon" />
                                                <div className="fav-text">
                                                    {bookmark.content.length > 200 
                                                        ? `${bookmark.content.substring(0, 200)}...` 
                                                        : bookmark.content}
                                                </div>
                                            </div>
                                            <div className="fav-footer">
                                                <div className="fav-meta">
                                                    <span className="fav-tag">Salvo em {new Date(bookmark.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <div className="fav-actions">
                                                    <button 
                                                        className="btn-remove-fav"
                                                        onClick={() => removeBookmark(bookmark.id)}
                                                        title="Remover"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className="separator-light"></div>

                        {/* INFORMAÇÕES PESSOAIS */}
                        <section className="p-section" ref={formRef}>
                            <div className="section-header">
                                <div className="section-title-group">
                                    <Settings className="title-icon" size={22} />
                                    <h2>Informações Pessoais</h2>
                                </div>
                                <p className="section-desc">Atualize seus dados básicos. Seu e-mail permanece privado.</p>
                            </div>

                            {status.message && (
                                <div className={`status-banner ${status.type} animate-fade-in`}>
                                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    <span>{status.message}</span>
                                </div>
                            )}

                            <form className="p-form-modern" onSubmit={updateProfile}>
                                <div className="modern-form-grid">
                                    <div className="input-field-group">
                                        <label htmlFor="p-name">Nome Completo</label>
                                        <div className="input-with-icon">
                                            <User size={18} className="field-icon" />
                                            <input
                                                id="p-name"
                                                type="text"
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                placeholder="Como gostaria de ser chamado?"
                                            />
                                        </div>
                                    </div>

                                    <div className="input-field-group">
                                        <label htmlFor="p-email">E-mail (Privado)</label>
                                        <div className="input-with-icon disabled">
                                            <Mail size={18} className="field-icon" />
                                            <input
                                                id="p-email"
                                                type="email"
                                                value={profile.email}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-form-footer">
                                    <button
                                        type="button"
                                        className="btn-back-link"
                                        onClick={() => navigate('/chat')}
                                    >
                                        Voltar ao Chat
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-save-premium"
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <div className="loading-inline">
                                                <div className="spinner-tiny"></div>
                                                <span>Salvando...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>Salvar Alterações</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>

                        <div className="separator-light"></div>

                        {/* PREFERÊNCIAS ESPIRITUAIS (LAYOUT PRONTO) */}
                        <section className="p-section">
                            <div className="section-header">
                                <div className="section-title-group">
                                    <Sparkles className="title-icon" size={22} />
                                    <h2>Preferências Espirituais</h2>
                                </div>
                                <p className="section-desc">Personalize sua experiência bíblica (funcionalidade em breve).</p>
                            </div>

                            <div className="preferences-preview">
                                <div className="pref-row">
                                    <div className="pref-col">
                                        <label>Versão Bíblica Preferida</label>
                                        <select disabled className="modern-select">
                                            <option>NVI (Nova Versão Internacional)</option>
                                            <option>Almeida Revista e Atualizada (ARA)</option>
                                            <option>Nova Versão Transformadora (NVT)</option>
                                        </select>
                                    </div>
                                    <div className="pref-col">
                                        <label>Horário de Devocional</label>
                                        <select disabled className="modern-select">
                                            <option>Manhã (Ao acordar)</option>
                                            <option>Tarde (Pausa do dia)</option>
                                            <option>Noite (Antes de dormir)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pref-checkbox-group">
                                    <label className="group-label">Temas de interesse</label>
                                    <div className="checkbox-grid">
                                        <div className="check-item">
                                            <input type="checkbox" checked disabled id="t1" />
                                            <label htmlFor="t1">Devocionais diários</label>
                                        </div>
                                        <div className="check-item">
                                            <input type="checkbox" disabled id="t2" />
                                            <label htmlFor="t2">Estudos aprofundados</label>
                                        </div>
                                        <div className="check-item">
                                            <input type="checkbox" checked disabled id="t3" />
                                            <label htmlFor="t3">Conselhos práticos</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
