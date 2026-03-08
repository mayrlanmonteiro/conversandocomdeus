import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User, LogOut } from 'lucide-react';
import './Header.css';

export default function Header() {
    const location = useLocation();
    const isChat = location.pathname === '/chat';
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Verificar sessão inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Escutar mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <header className={`header ${isChat ? 'is-light' : ''}`} id="main-header">
            <div className="header-inner container">
                <Link to="/" className="header-logo" aria-label="Conversando com Deus - Início">
                    <div className="logo-group">
                        <span className="logo-title">Conversando <span className="text-gold">com Deus</span></span>
                        <span className="logo-tagline visually-hidden-mobile">Assistente espiritual com IA</span>
                    </div>
                </Link>

                <nav className="header-nav" aria-label="Navegação principal">
                    {user ? (
                        <div className="user-nav">
                            <span className="user-email visually-hidden-mobile">{user.email}</span>
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Sair">
                                <LogOut size={16} />
                                <span className="visually-hidden-mobile">Sair</span>
                            </button>
                        </div>
                    ) : (
                        <div className="nav-guest">
                            <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginRight: '10px' }}>
                                Entrar
                            </Link>
                            {!isChat && (
                                <Link to="/chat" className="btn btn-primary btn-sm btn-glow" id="btn-start-chat-header">
                                    Iniciar Conversa
                                </Link>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
