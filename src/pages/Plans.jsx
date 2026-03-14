import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import './Plans.css';

export default function Plans() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isLoadingPix, setIsLoadingPix] = useState(false);
    const [user, setUser] = useState(null);
    const [pixData, setPixData] = useState(null);
    const [showPixModal, setShowPixModal] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
            }
        });
    }, [navigate]);

    const handleSubscribe = async (priceType) => {
        try {
            setLoading(true);

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planType: priceType,
                    userId: user.id
                }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(`O servidor retornou um erro não esperado (HTML/Texto): ${responseText.substring(0, 100)}...`);
            }

            if (!response.ok) throw new Error(data.error || 'Erro desconhecido no servidor');

            window.location.href = data.url;
        } catch (err) {
            console.error('Erro no checkout:', err);
            alert(`Erro ao iniciar checkout: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePix = async (planType) => {
        if (!user) {
            alert('Você precisa estar logado para assinar.');
            return;
        }

        try {
            setIsLoadingPix(true);
            setPixData(null);
            
            const res = await fetch('/api/mercadopago-pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType, userId: user.id }),
            });

            const responseText = await res.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error(`Erro ao gerar PIX: O servidor retornou resposta inválida.`);
            }

            if (!res.ok) {
                console.error('Erro PIX:', data);
                alert(`Não foi possível iniciar o pagamento PIX via Mercado Pago:\n${data.message || data.error || 'Erro desconhecido'}\n\nDetalhes: ${data.details || 'Verifique o console do navegador para mais informações.'}`);
                return;
            }

            setPixData(data);
            setShowPixModal(true);
        } catch (err) {
            console.error(err);
            alert(`Erro inesperado ao iniciar pagamento PIX: ${err.message}`);
        } finally {
            setIsLoadingPix(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Código PIX copiado para a área de transferência!');
    };

    const plans = [
        {
            id: 'monthly',
            name: 'Plano Mensal',
            price: 'R$ 19,90',
            period: '/ mês',
            description: 'Ideal para quem quer começar sua jornada espiritual acompanhada.',
            icon: <Zap className="plan-icon-inner" />,
            features: [
                'Conversas ilimitadas com a IA',
                'Acesso a todos os conselhos e orações',
                'Salvar favoritos ilimitados',
                'Suporte prioritário'
            ],
            buttonText: 'Começar Agora',
            highlight: false
        },
        {
            id: 'yearly',
            name: 'Plano Anual',
            price: 'R$ 199,00',
            period: '/ ano',
            description: 'O melhor valor para um compromisso profundo com sua fé.',
            icon: <Crown className="plan-icon-inner" />,
            features: [
                'Tudo do plano mensal',
                '2 meses grátis (economia de R$ 59,80)',
                'Acesso antecipado a novos recursos',
                'Badge "Membro Vitalício" no perfil'
            ],
            buttonText: 'Garantir Oferta',
            highlight: true
        }
    ];

    return (
        <div className="plans-page">
            <Header />
            
            <main className="plans-container container">
                <header className="plans-header text-center">
                    <span className="badge-premium">ESCOLHA SUA JORNADA</span>
                    <h1>Transforme sua vida espiritual</h1>
                    <p className="subtitle">Acesso completo a todas as ferramentas de estudo e aconselhamento bíblico.</p>
                </header>

                <div className="plans-grid">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`plan-card ${plan.highlight ? 'plan-featured' : ''}`}>
                            {plan.highlight && <div className="featured-label">MAIS POPULAR</div>}
                            
                            <div className="plan-top">
                                <div className={`plan-icon-box ${plan.highlight ? 'gold' : 'blue'}`}>
                                    {plan.icon}
                                </div>
                                <h3>{plan.name}</h3>
                                <div className="plan-price-box">
                                    <span className="price">{plan.price}</span>
                                    <span className="period">{plan.period}</span>
                                </div>
                                <p className="plan-desc">{plan.description}</p>
                            </div>

                            <div className="plan-features">
                                <ul>
                                    {plan.features.map((feature, index) => (
                                        <li key={index}>
                                            <Check size={18} className="check-icon" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="plan-footer">
                                <button 
                                    className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} btn-full`}
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loading || isLoadingPix}
                                >
                                    {loading ? 'Processando...' : plan.buttonText}
                                </button>
                                
                                <button
                                    className="btn btn-pix btn-full"
                                    onClick={() => handlePix(plan.id)}
                                    disabled={loading || isLoadingPix}
                                >
                                    {isLoadingPix ? 'Gerando PIX...' : 'Pagar com PIX (À vista)'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="plans-trust text-center">
                    <div className="trust-item">
                        <Shield size={20} />
                        <span>Pagamento seguro via Stripe & Mercado Pago</span>
                    </div>
                    <div className="trust-item">
                        <Sparkles size={20} />
                        <span>Liberação imediata após o pagamento</span>
                    </div>
                </div>
            </main>

            {/* Modal PIX */}
            {showPixModal && pixData && (
                <div className="pix-modal-overlay" onClick={() => setShowPixModal(false)}>
                    <div className="pix-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowPixModal(false)}>&times;</button>
                        
                        <div className="pix-modal-header">
                            <Zap size={32} className="pix-icon" />
                            <h2>Pagamento via PIX</h2>
                            <p>Escaneie o código abaixo com o app do seu banco</p>
                        </div>

                        <div className="qr-code-container">
                            {pixData.qr_base64 && (
                                <img 
                                    src={`data:image/png;base64,${pixData.qr_base64}`} 
                                    alt="QR Code PIX" 
                                    className="qr-code-img"
                                />
                            )}
                        </div>

                        <div className="pix-copy-section">
                            <p className="copy-label">Ou use o PIX Copia e Cola:</p>
                            <div className="copy-box">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={pixData.qr_code} 
                                    className="copy-input"
                                />
                                <button 
                                    className="btn-copy" 
                                    onClick={() => copyToClipboard(pixData.qr_code)}
                                >
                                    Copiar
                                </button>
                            </div>
                        </div>

                        <div className="pix-instructions">
                            <ol>
                                <li>Abra o app do seu banco</li>
                                <li>Escolha a opção <strong>Pagar com PIX</strong></li>
                                <li>Selecione <strong>Ler código QR</strong> ou <strong>Copia e Cola</strong></li>
                                <li>Após o pagamento, o seu acesso Premium será liberado automaticamente.</li>
                            </ol>
                        </div>

                        <button 
                            className="btn btn-secondary btn-full" 
                            onClick={() => setShowPixModal(false)}
                        >
                            Entendi, vou pagar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
