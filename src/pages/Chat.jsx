import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageInput from '../components/Chat/MessageInput';
import LoadingDots from '../components/ui/LoadingDots';
import SuggestionChips from '../components/Chat/SuggestionChips';
import Header from '../components/Layout/Header';
import { sendMessageStream } from '../services/ai';
import { ShieldCheck, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import './Chat.css';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [error, setError] = useState(null);
    const [lastSentMessage, setLastSentMessage] = useState('');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Rola para o fundo sempre que o histórico ou o streaming mudar
    useEffect(() => {
        if (messages.length > 0 || streamingContent) {
            scrollToBottom();
        }
    }, [messages, streamingContent]);

    // Função principal de envio de mensagem
    const sendMessage = async (text) => {
        const messageText = text || inputValue;
        if (!messageText.trim() || isLoading) return;

        const userMessage = { role: 'user', content: messageText.trim() };
        
        // Salva para possível reenvio em caso de erro
        setLastSentMessage(messageText.trim());
        
        setMessages(prev => [...prev, userMessage]);
        setInputValue(''); // Limpa o input após enviar
        setIsLoading(true);
        setError(null);
        setStreamingContent('');

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
            setError(err.message || "Erro inesperado ao enviar mensagem.");
            setIsLoading(false);
        }
    };

    // Lida com atalhos rápidos (Quick Prompts)
    const handleQuickPrompt = (type) => {
        let prompt = '';
        switch (type) {
            case 'bible-study':
                prompt = 'Monte um estudo bíblico para célula sobre [TEMA], com contexto, pontos principais, aplicações e perguntas.';
                break;
            case 'devocional':
                prompt = 'Crie um devocional para hoje sobre [TEMA], com versículo, reflexão e aplicação prática.';
                break;
            case 'pregacao':
                prompt = 'Me ajude a montar uma pregação sobre [TEMA], com introdução, 3 pontos principais e conclusão.';
                break;
            case 'conselho':
                prompt = 'Preciso de um conselho bíblico sobre a seguinte situação: [DESCREVA AQUI].';
                break;
            case 'explicar':
                prompt = 'Explique o contexto e o significado do texto bíblico de [REFERÊNCIA BÍBLICA] e aplique à vida prática.';
                break;
            default:
                prompt = '';
        }

        if (prompt) {
            setInputValue(prompt);
            // Focar no input após selecionar
            setTimeout(() => {
                const inputEl = document.getElementById('chat-message-input');
                if (inputEl) {
                    inputEl.focus();
                    inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
                }
            }, 0);
        }
    };

    const handleNewChat = () => {
        if (window.confirm('Deseja iniciar uma nova conversa e limpar o histórico?')) {
            setMessages([]);
            setStreamingContent('');
            setError(null);
            setInputValue('');
            setLastSentMessage('');
        }
    };

    const handleRetry = () => {
        if (lastSentMessage) {
            // Remove a última mensagem que falhou para não duplicar no UI local
            setMessages(prev => prev.slice(0, -1));
            sendMessage(lastSentMessage);
        }
    };

    return (
        <div className="chat-page">
            <Header />

            <div className="chat-panel">
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
                    <button className="btn-refresh-chat" onClick={handleNewChat} disabled={isLoading}>
                        <RefreshCw size={14} />
                        <span>Nova conversa</span>
                    </button>
                </header>

                <div className="safety-ribbon">
                    <div className="safety-pill">
                        <ShieldCheck size={14} />
                        <span>Espaço seguro e privativo para a sua fé.</span>
                    </div>
                </div>

                <main className="chat-messages-viewport">
                    <div className="messages-scroll-area">
                        {messages.length === 0 && !isLoading && (
                            <section className="chat-start-view animate-fade-in">
                                <div className="start-icon">🕊️</div>
                                <h2>Como posso te ajudar hoje?</h2>
                                <p>Escolha um tema abaixo ou escreva sua própria dúvida para iniciarmos.</p>

                                <div className="start-suggestion-box">
                                    <SuggestionChips onSelect={(t) => handleQuickPrompt(t.id)} />
                                </div>
                            </section>
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
                            <div className="chat-msg-error animate-fade-in">
                                <div className="error-bubble">
                                    <AlertCircle size={18} />
                                    <div className="error-text">
                                        <strong>Ops! Algo deu errado:</strong>
                                        <p>{error}</p>
                                        {lastSentMessage && (
                                            <button onClick={handleRetry} className="btn-retry-inline">Tentar reenviar</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                <footer className="chat-panel-footer">
                    <div className="footer-chips-wrapper">
                        <SuggestionChips onSelect={(t) => handleQuickPrompt(t.id)} hideLabel={true} />
                    </div>
                    <div className="input-container-premium">
                        <MessageInput
                            value={inputValue}
                            onChange={setInputValue}
                            onSend={sendMessage}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="footer-mini-disclaimer">
                        <p>Plataforma de apoio baseada em IA. Para suporte humano em crises, procure uma igreja ou profissional.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Chat;
