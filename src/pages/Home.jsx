import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { ArrowRight, BookOpen, Heart, MessageSquare, Calendar, PenTool, Sprout, Info, ShieldCheck } from 'lucide-react';
import './Home.css';

const FEATURES = [
    {
        icon: <BookOpen className="feature-icon-svg" />,
        title: 'Estudos Bíblicos',
        desc: 'Para grupos pequenos ou estudo individual, com contexto e perguntas para reflexão.',
    },
    {
        icon: <PenTool className="feature-icon-svg" />,
        title: 'Pregações e Sermões',
        desc: 'Esboços estruturados com base bíblica sólida, do título ao apelo final.',
    },
    {
        icon: <Sprout className="feature-icon-svg" />,
        title: 'Devocionais',
        desc: 'Meditações diárias para nutrir sua espiritualidade em poucos minutos.',
    },
    {
        icon: <Heart className="feature-icon-svg" />,
        title: 'Conselhos Bíblicos',
        desc: 'Apoio acolhedor para as situações difíceis da vida sob a luz das Escrituras.',
    },
    {
        icon: <Calendar className="feature-icon-svg" />,
        title: 'Planos de Leitura',
        desc: 'Guia organizado para ler toda a Bíblia ou temas específicos sistematicamente.',
    },
    {
        icon: <MessageSquare className="feature-icon-svg" />,
        title: 'Orações-Modelo',
        desc: 'Sugestões de oração inspiradoras para guiar seu momento de intercessão.',
    },
];

const STEPS = [
    { number: '01', title: 'Abra o chat', desc: 'Clique em "Começar Conversa" e entre no espaço de diálogo seguro e privativo.', icon: <MessageSquare size={24} /> },
    { number: '02', title: 'Compartilhe seu coração', desc: 'Faça perguntas, peça um estudo ou compartilhe o que está sentindo no momento.', icon: <Heart size={24} /> },
    { number: '03', title: 'Receba orientação', desc: 'O assistente responde com fundamentação bíblica, empatia e cuidado espiritual.', icon: <BookOpen size={24} /> },
];

export default function Home() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        const particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.2,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: -Math.random() * 0.3 - 0.1,
                opacity: Math.random() * 0.4 + 0.1,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(244, 211, 106, ${p.opacity})`;
                ctx.fill();
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.y < -10) {
                    p.y = canvas.height + 10;
                    p.x = Math.random() * canvas.width;
                }
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="home-page">
            <Header />

            {/* HERO SECTION */}
            <section className="hero" id="hero">
                <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
                <div className="hero-glow" aria-hidden="true" />

                <div className="hero-content container">
                    <div className="animate-fade-in hero-badge">
                        <span className="badge-text">Assistente Espiritual com IA</span>
                    </div>

                    <h1 className="hero-title animate-fade-in">
                        Conversando <br />
                        <span className="hero-title-accent">com Deus</span>
                    </h1>

                    <p className="hero-subtitle animate-fade-in delay-1">
                        Um espaço de apoio espiritual e estudo bíblico. Faça perguntas,
                        peça devocionais e receba orientações fundamentadas nas Escrituras —
                        com a profundidade que sua fé merece.
                    </p>

                    <div className="hero-actions animate-fade-in delay-2">
                        <Link to="/chat" className="btn btn-primary btn-large btn-glow" id="btn-start-chat-hero">
                            🕊️ Começar Conversa
                        </Link>
                        <a href="#como-funciona" className="btn btn-secondary btn-large" id="btn-how-it-works">
                            Como funciona
                        </a>
                    </div>
                </div>

                <div className="hero-scroll-indicator" aria-hidden="true">
                    <div className="mouse">
                        <div className="wheel"></div>
                    </div>
                </div>
            </section>

            {/* COMO FUNCIONA */}
            <section id="como-funciona" className="steps-section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-label">O Processo</span>
                        <h2 className="section-title">Simples como uma conversa</h2>
                        <p className="section-desc">
                            Inicie sua jornada espiritual em três etapas simples e intuitivas.
                        </p>
                    </div>

                    <div className="steps-grid">
                        {STEPS.map((step) => (
                            <div className="step-card card" key={step.number}>
                                <div className="step-icon">
                                    {step.icon}
                                </div>
                                <div className="step-content">
                                    <span className="step-number">{step.number}</span>
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-desc">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FUNCIONALIDADES */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center">
                        <span className="section-label">Capacidades da IA</span>
                        <h2 className="section-title">Tudo o que você precisa<br />para crescer na fé</h2>
                    </div>

                    <div className="features-grid">
                        {FEATURES.map((f) => (
                            <div className="feature-card card" key={f.title}>
                                <div className="feature-icon-wrapper">
                                    {f.icon}
                                </div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* EXPERIÊNCIA E BENEFÍCIOS */}
            <section className="experience-section">
                <div className="container">
                    <div className="experience-grid">
                        <div className="experience-text">
                            <span className="section-label">A Nossa Base</span>
                            <h2 className="section-title">Compromisso com a <br /><span className="text-gold">Palavra e com Você</span></h2>
                            <p className="experience-desc">
                                Nosso assistente foi desenvolvido sob uma perspectiva cristã evangélica,
                                mas acolhe com profundo respeito e empatia pessoas de todas as crenças.
                                O foco é oferecer um apoio equilibrado, seguro e fiel às Escrituras.
                            </p>

                            <div className="benefit-list">
                                <div className="benefit-item">
                                    <ShieldCheck className="benefit-icon" />
                                    <span>Seguro e totalmente privativo</span>
                                </div>
                                <div className="benefit-item">
                                    <Calendar className="benefit-icon" />
                                    <span>Disponível 24 horas por dia</span>
                                </div>
                                <div className="benefit-item">
                                    <Sprout className="benefit-icon" />
                                    <span>Linguagem acessível e acolhedora</span>
                                </div>
                                <div className="benefit-item">
                                    <Info className="benefit-icon" />
                                    <span>Sem necessidade de cadastro antecipado</span>
                                </div>
                                <div className="benefit-item">
                                    <BookOpen className="benefit-icon" />
                                    <span>Ideal para líderes, pastores e membros</span>
                                </div>
                            </div>
                        </div>
                        <div className="experience-visual">
                            <div className="mockup-container">
                                <div className="mockup-frame">
                                    <div className="mockup-header">
                                        <div className="dot red"></div>
                                        <div className="dot yellow"></div>
                                        <div className="dot green"></div>
                                    </div>
                                    <div className="mockup-content">
                                        <div className="msg ia">📖 Me ajude com um estudo sobre esperança...</div>
                                        <div className="msg user">Olá! Aqui está um esboço baseado em Romanos 15:13...</div>
                                        <div className="msg ia">Paz do Senhor. Qual o versículo de hoje?</div>
                                        <div className="msg-skeleton"></div>
                                        <div className="msg-skeleton short"></div>
                                    </div>
                                </div>
                                <div className="mockup-glow"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-box card">
                        <div className="cta-content">
                            <h2 className="cta-title">Pronto para começar sua jornada?</h2>
                            <blockquote className="cta-verse">
                                "Clama a mim, e eu te responderei, e te anunciarei coisas grandes e ocultas, que não sabes." — Jeremias 33:3
                            </blockquote>
                            <div className="cta-actions">
                                <Link to="/chat" className="btn btn-primary btn-large btn-glow" id="btn-start-chat-cta">
                                    🕊️ Iniciar Conversa Agora
                                </Link>
                            </div>
                            <p className="cta-footer-note">Gratuito · Privativo · Disponível 24h</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </section>
        </div>
    );
}
