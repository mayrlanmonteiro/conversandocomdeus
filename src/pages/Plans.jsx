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
            const res = await fetch('/api/create-pix-session', {
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
                console.error(data.error);
                alert(`Não foi possível iniciar o pagamento PIX: ${data.error}`);
                return;
            }

            window.location.href = data.url; // redireciona para o Checkout (QR Code PIX)
        } catch (err) {
            console.error(err);
            alert(`Erro inesperado ao iniciar pagamento PIX: ${err.message}`);
        } finally {
            setIsLoadingPix(false);
        }
    };

    const plans = [
        {
            id: 'monthly',
            name: 'Plano Mensal',
            price: 'R$ 29,90',
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
            price: 'R$ 299,00',
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
                        <span>Pagamento seguro via Stripe</span>
                    </div>
                    <div className="trust-item">
                        <Sparkles size={20} />
                        <span>Cancele a qualquer momento</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
