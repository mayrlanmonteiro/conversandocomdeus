import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Sparkles, X, ChevronRight } from 'lucide-react';
import './LimitModal.css';

const LimitModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="limit-modal-overlay">
            <div className="limit-modal-container animate-fade-in">
                <button className="limit-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="limit-modal-content">
                    <div className="limit-icon-wrapper">
                        <div className="limit-icon-bg">
                            <Lock className="lock-icon" />
                            <Crown className="crown-icon-float" />
                        </div>
                    </div>

                    <header className="limit-header">
                        <h2>Limite atingido</h2>
                        <p>Sua jornada diária gratuita chegou ao fim por hoje.</p>
                    </header>

                    <div className="limit-benefits">
                        <div className="benefit-item">
                            <Sparkles className="benefit-icon" />
                            <div className="benefit-text">
                                <strong>Conversas Ilimitadas</strong>
                                <span>Fale com a IA o quanto quiser, sem limites diários.</span>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <Crown className="benefit-icon" />
                            <div className="benefit-text">
                                <strong>Acesso Prioritário</strong>
                                <span>Respostas mais rápidas e acesso a novos recursos bíblicos.</span>
                            </div>
                        </div>
                    </div>

                    <div className="limit-actions">
                        <button 
                            className="btn btn-primary btn-large btn-full"
                            onClick={() => navigate('/planos')}
                        >
                            Quero ser Premium
                            <ChevronRight size={18} />
                        </button>
                        <button 
                            className="btn btn-secondary btn-full"
                            onClick={onClose}
                        >
                            Continuar Limitado
                        </button>
                    </div>

                    <p className="limit-footer-text">
                        Sua cota reinicia amanhã. Que tal aprofundar sua fé hoje com o plano Premium?
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LimitModal;
