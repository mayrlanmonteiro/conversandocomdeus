import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageInput from '../components/Chat/MessageInput';
import LoadingDots from '../components/ui/LoadingDots';
import SuggestionChips from '../components/Chat/SuggestionChips';
import Header from '../components/Layout/Header';
import { sendMessageStream } from '../services/ai';
import { supabase } from '../lib/supabase';
import { ShieldCheck, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import './Chat.css';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [error, setError] = useState(null);
    const [lastSentMessage, setLastSentMessage] = useState('');
    const [user, setUser] = useState(null);

    const messagesEndRef = useRef(null);

    const loadChatHistory = async (userId) => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao carregar histórico:', error);
        } else if (data) {
            setMessages(data.map(m => ({ role: m.role, content: m.content })));
        }
    };

    const saveMessage = async (role, content, userId) => {
        const currentUserId = userId || user?.id;
        if (!currentUserId) return;

        const { error } = await supabase
            .from('chat_messages')
            .insert([
                { user_id: currentUserId, role, content }
            ]);

        if (error) console.error('Erro ao salvar mensagem:', error);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Verificar autenticação e carregar histórico
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                loadChatHistory(session.user.id);
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadChatHistory(session.user.id);
            } else {
                setMessages([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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

        // Persistir mensagem do usuário
        saveMessage('user', userMessage.content);

        let accumulated = '';

        try {
            await sendMessageStream(
                [...messages, userMessage],
                (chunk) => {
                    accumulated += chunk;
                    setStreamingContent(accumulated);
                },
                () => {
                    const assistantMessage = { role: 'assistant', content: accumulated };
                    setMessages(prev => [...prev, assistantMessage]);
                    setStreamingContent('');
                    setIsLoading(false);

                    // Persistir resposta do assistente
                    saveMessage('assistant', accumulated);
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

    const handleNewChat = async () => {
        const confirmMsg = user
            ? 'Deseja iniciar uma nova conversa? Isso limpará o histórico visual, mas suas mensagens continuam salvas no seu perfil.'
            : 'Deseja iniciar uma nova conversa e limpar o histórico?';

        if (window.confirm(confirmMsg)) {
            // Se quiser limpar mesmo no banco de dados, faríamos um DELETE aqui.
            // Por enquanto, apenas limpamos o estado local para uma "nova sessão" visual.
            if (user) {
                const { error } = await supabase
                    .from('chat_messages')
                    .delete()
                    .eq('user_id', user.id);

                if (error) console.error('Erro ao limpar histórico:', error);
            }

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
                                {user ? (
                                    <>
                                        <h2>Olá! Como posso te ajudar hoje?</h2>
                                        <p>Sua conversa está sendo salva para você nunca perder um conselho importante.</p>
                                    </>
                                ) : (
                                    <>
                                        <h2>Como posso te ajudar hoje?</h2>
                                        <p>Escolha um tema abaixo ou escreva sua própria dúvida para iniciarmos.</p>
                                    </>
                                )}

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
                    {messages.length > 0 && (
                        <div className="footer-chips-wrapper">
                            <SuggestionChips onSelect={(t) => handleQuickPrompt(t.id)} hideLabel={true} />
                        </div>
                    )}
                    <div className="input-container-premium">
                        <MessageInput
                            value={inputValue}
                            onChange={setInputValue}
                            onSend={sendMessage}
                            disabled={isLoading}
                        />
                    </div>
                    {!user && (
                        <div className="auth-nudge-footer">
                            <p><Sparkles size={12} /> <Link to="/login">Faça login</Link> para salvar seu histórico de aconselhamento.</p>
                        </div>
                    )}
                    <div className="footer-mini-disclaimer">
                        <p>Plataforma de apoio baseada em IA. Para suporte humano em crises, procure uma igreja ou profissional.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Chat;
