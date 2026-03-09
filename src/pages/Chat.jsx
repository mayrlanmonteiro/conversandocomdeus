import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageInput from '../components/Chat/MessageInput';
import LoadingDots from '../components/ui/LoadingDots';
import SuggestionChips from '../components/Chat/SuggestionChips';
import Header from '../components/Layout/Header';
import { sendMessageStream } from '../services/ai';
import { supabase } from '../lib/supabase';
import { ShieldCheck, RefreshCw, Sparkles, AlertCircle, Menu, X, MessageSquare, Trash2, Plus } from 'lucide-react';
import './Chat.css';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [error, setError] = useState(null);
    const [lastSentMessage, setLastSentMessage] = useState('');
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const messagesEndRef = useRef(null);

    const loadChatHistory = async (userId, conversationId) => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao carregar histórico:', error);
        } else if (data) {
            setMessages(data.map(m => ({ role: m.role, content: m.content })));
        }
    };

    const fetchConversations = async (userId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar conversas:', error);
        } else {
            setConversations(data || []);
        }
    };

    const saveMessage = async (role, content, userId, conversationId) => {
        const currentUserId = userId || user?.id;
        const currentConvId = conversationId || activeConversationId;
        if (!currentUserId || !currentConvId) return;

        const { error } = await supabase
            .from('chat_messages')
            .insert([
                { user_id: currentUserId, role, content, conversation_id: currentConvId }
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
                fetchConversations(session.user.id);
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchConversations(session.user.id);
            } else {
                setMessages([]);
                setConversations([]);
                setActiveConversationId(null);
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
        let currentConvId = activeConversationId;

        if (user && !currentConvId) {
            // Criar nova conversa se for o primeiro envio de um usuário logado
            const title = messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText;
            const { data, error: convError } = await supabase
                .from('conversations')
                .insert([{ user_id: user.id, title }])
                .select()
                .single();

            if (convError) {
                console.error('Erro ao criar conversa:', convError);
            } else if (data) {
                currentConvId = data.id;
                setActiveConversationId(data.id);
                fetchConversations(user.id);
            }
        }

        saveMessage('user', userMessage.content, user?.id, currentConvId);

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
                    saveMessage('assistant', accumulated, user?.id, currentConvId);

                    // Atualizar o timestamp da conversa
                    if (currentConvId) {
                        supabase.from('conversations')
                            .update({ updated_at: new Date().toISOString() })
                            .eq('id', currentConvId);
                    }
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
        setMessages([]);
        setActiveConversationId(null);
        setStreamingContent('');
        setError(null);
        setInputValue('');
        setLastSentMessage('');
        setIsSidebarOpen(false);
    };

    const handleSelectConversation = (id) => {
        setActiveConversationId(id);
        loadChatHistory(user.id, id);
        setIsSidebarOpen(false);
    };

    const handleDeleteConversation = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir esta conversa do seu histórico?')) {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao deletar conversa:', error);
            } else {
                if (activeConversationId === id) {
                    handleNewChat();
                }
                fetchConversations(user.id);
            }
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

            <div className="chat-layout">
                {/* Sidebar com Histórico */}
                <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <h2>Histórico</h2>
                        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <button className="new-chat-sidebar-btn" onClick={handleNewChat}>
                        <Plus size={18} />
                        Nova Conversa
                    </button>

                    <div className="conversations-list">
                        {!user ? (
                            <div className="sidebar-guest-nudge">
                                <Sparkles size={16} />
                                <p>Entre para salvar suas conversas e acessá-las aqui futuramente.</p>
                                <Link to="/login" className="btn btn-secondary btn-sm">Fazer Login</Link>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="sidebar-empty">
                                <p>Nenhuma conversa ainda.</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                                    onClick={() => handleSelectConversation(conv.id)}
                                >
                                    <MessageSquare size={16} />
                                    <span className="conv-title">{conv.title}</span>
                                    <button
                                        className="btn-delete-conv"
                                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                                        title="Excluir conversa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                <div className="chat-panel">
                    <header className="chat-panel-header">
                        <div className="chat-header-info">
                            <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={20} />
                            </button>
                            <div className="header-icon-rounded">
                                <Sparkles size={20} />
                            </div>
                            <div className="header-titles">
                                <h3>{activeConversationId ? conversations.find(c => c.id === activeConversationId)?.title : 'Assistente Spiritual'}</h3>
                                <p>Conversando com Deus</p>
                            </div>
                        </div>
                        <button className="btn-refresh-chat" onClick={handleNewChat} disabled={isLoading}>
                            <RefreshCw size={14} />
                            <span className="visually-hidden-mobile">Nova conversa</span>
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
                                            <p>Suas conversas agora são salvas individualmente no seu histórico ao lado.</p>
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
                        <div className="footer-mini-disclaimer">
                            <p>Plataforma de apoio baseada em IA. Para suporte humano em crises, procure uma igreja ou profissional.</p>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default Chat;
