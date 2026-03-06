import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
    const location = useLocation();
    const isChat = location.pathname === '/chat';

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
                    {isChat ? (
                        <Link to="/" className="btn btn-secondary btn-sm" id="btn-back-home">
                            ← Voltar ao Início
                        </Link>
                    ) : (
                        <Link to="/chat" className="btn btn-primary btn-sm btn-glow" id="btn-start-chat-header">
                            Iniciar Conversa
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
