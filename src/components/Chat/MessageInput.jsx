import { useRef, useEffect } from 'react';
import './MessageInput.css';

export default function MessageInput({ value, onChange, onSend, disabled }) {
    const textareaRef = useRef(null);

    // Auto-resize do textarea conforme o conteúdo
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
        }
    }, [value]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        
        onSend(trimmed);
        
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <form className="message-input-form" onSubmit={handleSubmit} aria-label="Enviar mensagem">
            <div className="message-input-wrapper">
                <textarea
                    ref={textareaRef}
                    id="chat-message-input"
                    className="message-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex.: 'Crie um devocional sobre Salmo 23' ou 'Me ajude a montar um estudo sobre perdão'..."
                    disabled={disabled}
                    rows={1}
                    aria-label="Campo de mensagem"
                />
                <button
                    type="submit"
                    id="btn-send-message"
                    className={`send-btn ${value.trim() && !disabled ? 'send-btn-active' : ''}`}
                    disabled={!value.trim() || disabled}
                    aria-label="Enviar mensagem"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
            <p className="input-hint">Shift+Enter para nova linha · Enter para enviar</p>
        </form>
    );
}
