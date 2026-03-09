import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: '', password: '' };

        // Validação de e-mail
        if (!email.trim()) {
            newErrors.email = 'Por favor, informe seu e-mail.';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Por favor, insira um e-mail válido.';
            isValid = false;
        }

        // Validação de senha
        if (!password) {
            newErrors.password = 'Por favor, informe sua senha.';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
            isValid = false;
        }

        setFieldErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: 'https://conversandocomdeus.vercel.app/chat'
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
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/chat'
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <header className="login-header">
                    <Link to="/" className="login-logo" aria-label="Voltar ao início">
                        <img src="/logo.png" alt="Conversando com Deus" className="brand-logo-login" />
                    </Link>
                    <h2>{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</h2>
                    <p>{isSignUp ? 'Comece sua jornada espiritual hoje.' : 'Acesse seu histórico e continue sua jornada.'}</p>
                </header>

                {error && (
                    <div className="error-banner animate-fade-in" role="alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email">E-mail</label>
                        <div className={`input-wrapper ${fieldErrors.email ? 'has-error' : ''}`}>
                            <Mail className="input-icon" size={18} />
                            <input
                                id="email"
                                type="email"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                                }}
                                required
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                            />
                        </div>
                        {fieldErrors.email && (
                            <span id="email-error" className="field-error-msg">{fieldErrors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <div className="label-row">
                            <label htmlFor="password">Senha</label>
                            {!isSignUp && (
                                <Link to="/forgot-password" id="forgot-password-link" className="helper-link">
                                    Esqueceu a senha?
                                </Link>
                            )}
                        </div>
                        <div className={`input-wrapper ${fieldErrors.password ? 'has-error' : ''}`}>
                            <Lock className="input-icon" size={18} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Sua senha segura"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                                }}
                                required
                                aria-invalid={!!fieldErrors.password}
                                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <span id="password-error" className="field-error-msg">{fieldErrors.password}</span>
                        )}
                    </div>

                    <button type="submit" className="login-btn-premium" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="spinner" size={20} />
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                                <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Separador visual com alto contraste */}
                <div className="divider-premium">
                    <span className="divider-text">ou continue com</span>
                </div>

                <div className="social-login-premium">
                    <button onClick={handleGoogleLogin} className="google-btn" type="button" disabled={loading}>
                        <img src="https://www.google.com/favicon.ico" alt="" width="18" height="18" />
                        <span>Google</span>
                    </button>
                </div>

                <footer className="login-card-footer">
                    {isSignUp ? (
                        <p>Já tem uma conta? <button type="button" className="text-btn" onClick={() => setIsSignUp(false)}>Entrar</button></p>
                    ) : (
                        <p>Ainda não tem conta? <button type="button" className="text-btn" onClick={() => setIsSignUp(true)}>Cadastre-se</button></p>
                    )}
                </footer>
            </div>
        </div>
    );
}
