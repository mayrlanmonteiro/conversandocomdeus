import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageInput from '../components/Chat/MessageInput';
import LoadingDots from '../components/ui/LoadingDots';
import SuggestionChips from '../components/Chat/SuggestionChips';
import Header from '../components/Layout/Header';
import { sendMessageStream } from '../services/ai';
import { ShieldCheck, X, RefreshCw, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import './Chat.css';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [error, setError] = useState(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [templateValues, setTemplateValues] = useState({});

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        let accumulated = '';

        try {
            await sendMessageStream(
                [...messages, userMessage],
                (chunk) => {
                    accumulated += chunk;
                    setStreamingContent(accumulated);
                },
                () => {
                    setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
                    setStreamingContent('');
                    setIsLoading(false);
                },
                (err) => {
                    setError(err);
                    setIsLoading(false);
                }
            );
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (template) => {
        setActiveTemplate(template);
        const initialValues = {};
        template.fields.forEach(f => {
            initialValues[f.id] = f.defaultValue || '';
        });
        setTemplateValues(initialValues);
    };

    const handleTemplateSubmit = (e) => {
        e.preventDefault();
        const prompt = activeTemplate.generatePrompt(templateValues);
        setActiveTemplate(null);
        sendMessage(prompt);
    };

    const handleNewChat = () => {
        if (window.confirm('Deseja iniciar uma nova conversa e limpar o histórico?')) {
            setMessages([]);
            setStreamingContent('');
            setError(null);
            setActiveTemplate(null);
        }
    };

    return (
        <div className="chat-page">
            <Header />

            {/* Painel Central do Chat (Premium Light - Antigravity) */}
            <div className="chat-panel">

                {/* Header Claro do Chat */}
                <header className="chat-panel-header">
                    <div className="chat-header-info">
                        <div className="header-icon-rounded">
                            <Sparkles size={20} />
                        </div>
                        <div className="header-titles">
                            <h3>Assistente – Conversando com Deus</h3>
                            <p>IA de apoio espiritual (não substitui um pastor ou profissional)</p>
                        </div>
                    </div>
                    <button className="btn-refresh-chat" onClick={handleNewChat}>
                        <RefreshCw size={14} />
                        <span>Nova conversa</span>
                    </button>
                </header>

                {/* Área de Avisos / Selo de Segurança */}
                <div className="safety-ribbon">
                    <div className="safety-pill">
                        <ShieldCheck size={14} />
                        <span>Espaço seguro e privativo para a sua fé.</span>
                    </div>
                </div>

                {/* Área de Mensagens */}
                <main className="chat-messages-viewport">
                    <div className="messages-scroll-area">
                        {messages.length === 0 && !isLoading && !activeTemplate && (
                            <section className="chat-start-view animate-fade-in">
                                <div className="start-icon">🕊️</div>
                                <h2>Como posso te ajudar hoje?</h2>
                                <p>Inicie sua jornada espiritual escolhendo um dos modelos abaixo ou digitando livremente sua necessidade.</p>

                                <div className="start-suggestion-box">
                                    <SuggestionChips onSelect={handleSuggestionClick} />
                                </div>
                            </section>
                        )}

                        {activeTemplate && (
                            <div className="chat-modal-overlay">
                                <div className="template-card-panel">
                                    <div className="template-card-header">
                                        <div className="title-with-icon">
                                            <BookOpen size={20} className="text-blue" />
                                            <h4>{activeTemplate.title}</h4>
                                        </div>
                                        <button className="btn-close-modal" onClick={() => setActiveTemplate(null)}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleTemplateSubmit} className="template-form-premium">
                                        <div className="form-fields-grid">
                                            {activeTemplate.fields.map(field => (
                                                <div key={field.id} className="premium-form-group">
                                                    <label>{field.label}</label>
                                                    {field.id === 'situacao' || (field.id === 'tema' && (activeTemplate.id === 'bible-study' || activeTemplate.id === 'devocional')) ? (
                                                        <textarea
                                                            required={field.required}
                                                            value={templateValues[field.id] || ''}
                                                            onChange={(e) => setTemplateValues({ ...templateValues, [field.id]: e.target.value })}
                                                            placeholder={field.placeholder}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            required={field.required}
                                                            value={templateValues[field.id] || ''}
                                                            onChange={(e) => setTemplateValues({ ...templateValues, [field.id]: e.target.value })}
                                                            placeholder={field.placeholder}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button type="submit" className="btn btn-primary btn-full">Gerar Orientação Bíblica</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <MessageBubble key={index} message={msg} />
                        ))}

                        {streamingContent && (
                            <MessageBubble message={{ role: 'assistant', content: streamingContent }} isStreaming={true} />
                        )}

                        {isLoading && !streamingContent && (
                            <div className="assistant-loading-indicator">
                                <LoadingDots />
                                <span>Refletindo sobre as Escrituras...</span>
                            </div>
                        )}

                        {error && (
                            <div className="chat-critical-error">
                                <div className="error-card-premium">
                                    <AlertCircle className="error-icon" />
                                    <div className="error-content">
                                        <h4>Houve um problema de conexão</h4>
                                        <p>{error}</p>
                                        <button onClick={() => window.location.reload()} className="btn-retry">Tentar novamente</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Área de Entrada de Mensagem */}
                <footer className="chat-panel-footer">
                    <div className="footer-chips-wrapper">
                        <SuggestionChips onSelect={handleSuggestionClick} hideLabel={true} />
                    </div>
                    <div className="input-container-premium">
                        <MessageInput onSend={sendMessage} disabled={isLoading} />
                    </div>
                    <div className="footer-mini-disclaimer">
                        <p>Plataforma de apoio espiritual baseada em IA. Para suporte humano em crises, procure uma igreja local ou profissional de saúde.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Chat;
