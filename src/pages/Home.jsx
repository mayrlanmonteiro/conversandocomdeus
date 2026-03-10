import { useEffect, useRef } from 'react';
import { BookOpen, Heart, MessageSquare } from 'lucide-react';
import LoginForm from '../components/Auth/LoginForm';
import './Home.css';

export default function Home() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        const particles = [];

        const resize = () => {
            // Se ajustar as dimensões pelo container, melhora o redimensionamento split screen.
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 60; i++) {
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
        <main className="split-home">
            {/* INSPIRATION COLUMN (ESQUERDA) */}
            <section className="split-left">
                <canvas ref={canvasRef} className="split-canvas" aria-hidden="true" />
                <div className="split-glow" aria-hidden="true" />

                <div className="split-logo-container">
                    <img src="/logo.png" alt="Conversando com Deus" className="split-logo" />
                </div>

                <div className="split-left-content">
                    <h1 className="split-title">
                        Um espaço seguro para conversar com Deus, estudar e receber direção.
                    </h1>

                    <p className="split-subtitle">
                        Faça perguntas, peça devocionais e receba orientações fundamentadas nas Escrituras — com a profundidade que sua fé merece.
                    </p>

                    <ul className="split-benefits">
                        <li>
                            <div className="benefit-icon-wrapper">
                                <BookOpen className="benefit-icon" />
                            </div>
                            <span>Devocionais e estudos bíblicos em instantes</span>
                        </li>
                        <li>
                            <div className="benefit-icon-wrapper">
                                <MessageSquare className="benefit-icon" />
                            </div>
                            <span>Conselhos com base nas Escrituras</span>
                        </li>
                        <li>
                            <div className="benefit-icon-wrapper">
                                <Heart className="benefit-icon" />
                            </div>
                            <span>Histórico das suas conversas em um só lugar</span>
                        </li>
                    </ul>
                </div>

                <div className="split-footer-verse">
                    <blockquote className="split-verse">
                        "Clama a mim, e eu te responderei, e te anunciarei coisas grandes e ocultas, que não sabes." <br />— Jeremias 33:3
                    </blockquote>
                </div>
            </section>

            {/* LOGIN COLUMN (DIREITA) */}
            <section className="split-right">
                <LoginForm />
            </section>
        </main>
    );
}
