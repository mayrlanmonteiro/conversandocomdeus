import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (signUpError) throw signUpError;
                alert('Verifique seu e-mail para confirmar o cadastro!');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;
                navigate('/chat');
            }
        } catch (err) {
            setError(err.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/chat'
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <Link to="/" className="login-logo">
                        <span className="logo-title">Conversando <span className="text-gold">com Deus</span></span>
                    </Link>
                    <h2>{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</h2>
                    <p>{isSignUp ? 'Comece sua jornada espiritual hoje.' : 'Acesse seu histórico e continue sua jornada.'}</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray-light)' }} />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray-light)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            'Carregando...'
                        ) : (
                            <>
                                {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                                {isSignUp ? 'Criar Conta' : 'Entrar'}
                            </>
                        )}
                    </button>
                </form>

                <div className="divider">ou continue com</div>

                <div className="social-login">
                    <button onClick={handleGoogleLogin} className="social-btn">
                        <img src="https://www.google.com/favicon.ico" alt="Google" width="18" />
                        Google
                    </button>
                </div>

                <div className="login-footer">
                    {isSignUp ? (
                        <p>Já tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); }}>Entrar</a></p>
                    ) : (
                        <p>Ainda não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); }}>Cadastre-se</a></p>
                    )}
                </div>
            </div>
        </div>
    );
}
