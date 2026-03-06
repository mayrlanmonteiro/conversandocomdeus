import { Book } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-verse">
                    <Book className="footer-verse-icon" size={20} />
                    <p className="footer-verse-text">
                        "Clama a mim, e eu te responderei, e te anunciarei coisas grandes e ocultas, que não sabes."
                    </p>
                    <span className="footer-verse-ref">Jeremias 33:3 (NVI)</span>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copy">
                        © {new Date().getFullYear()} Conversando com Deus · Feito com fé e tecnologia 🕊️
                    </p>
                    <div className="footer-disclaimer-card">
                        <p className="footer-disclaimer">
                            <strong>Aviso Importante:</strong> Este assistente é uma ferramenta de apoio espiritual baseada em IA e na Bíblia Sagrada.
                            Ele não substitui pastores, líderes espirituais ou profissionais de saúde mental.
                            Em situações de crise emocional profunda ou dilemas teológicos graves, procure sua liderança local ou ajuda profissional imediata.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
