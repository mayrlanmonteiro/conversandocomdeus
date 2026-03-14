import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MessageBubble from '../components/Chat/MessageBubble';
import MessageInput from '../components/Chat/MessageInput';
import LoadingDots from '../components/ui/LoadingDots';
import SuggestionChips from '../components/Chat/SuggestionChips';
import Header from '../components/Layout/Header';
import { sendMessageStream } from '../services/ai';
import { supabase } from '../lib/supabase';
import { ShieldCheck, RefreshCw, Sparkles, AlertCircle, Menu, X, MessageSquare, Trash2, Plus, Crown } from 'lucide-react';
import LimitModal from '../components/Chat/LimitModal';
import './Chat.css';
import '../components/Chat/LimitModal.css';

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
    const [bookmarks, setBookmarks] = useState([]);
    const [isPremium, setIsPremium] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [messageCountToday, setMessageCountToday] = useState(0);

    const DAILY_LIMIT = 5; // Limite de mensagens por dia para usuários gratuitos

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

    const fetchBookmarks = async (userId) => {
        const { data, error } = await supabase
            .from('bookmarks')
            .select('content')
            .eq('user_id', userId);

        if (!error && data) {
            setBookmarks(data.map(b => b.content));
        }
    };

    const handleBookmark = async (message) => {
        if (!user) {
            alert('Faça login para salvar seus favoritos.');
            return;
        }

        const { error } = await supabase
            .from('bookmarks')
            .insert([{
                user_id: user.id,
                conversation_id: activeConversationId,
                content: message.content,
                role: 'assistant'
            }]);

        if (error) {
            console.error('Erro ao favoritar:', error);
        } else {
            setBookmarks(prev => [...prev, message.content]);
        }
    };

    const checkPremiumStatus = async (currentUser) => {
        if (!currentUser) return;
        
        // Checar tabela profiles (oficial)
        const { data } = await supabase
            .from('profiles')
            .select('subscription_status, billing_method, active_until')
            .eq('id', currentUser.id)
            .single();
        
        if (!data) return;

        let premium = false;

        if (data.subscription_status === 'active') {
            if (data.billing_method === 'pix' || data.billing_method === 'pix_mp') {
                // Para PIX (Stripe ou Mercado Pago), conferir se ainda está no prazo
                if (data.active_until && new Date(data.active_until) > new Date()) {
                    premium = true;
                }
            } else {
                // Para Cartão (subscription), se está active, está valendo
                premium = true;
            }
        }

        setIsPremium(premium);
    };

    const fetchMessageCount = async (userId) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('role', 'user')
            .gte('created_at', today.toISOString());

        if (!error) {
            setMessageCountToday(count || 0);
        }
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
                fetchBookmarks(session.user.id);
                checkPremiumStatus(session.user);
                fetchMessageCount(session.user.id);
            } else {
                setMessages([]);
                setConversations([]);
                setActiveConversationId(null);
                setBookmarks([]);
                setIsPremium(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Função para rolar até o fundo do chat
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

        // Verificar limite para usuários não premium
        if (!isPremium && messageCountToday >= DAILY_LIMIT) {
            setIsLimitModalOpen(true);
            return;
        }

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
                    
                    // Incrementar contador local
                    if (!isPremium) {
                        setMessageCountToday(prev => prev + 1);
                    }

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
                        <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <button className="new-chat-sidebar-btn" onClick={handleNewChat}>
                        <Plus size={18} />
                        Nova Conversa
                    </button>

                    <h3 className="sidebar-list-title">Histórico</h3>

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
                    <main className="chat-messages-viewport">
                        {/* Sidebar Toggle for Mobile - Floating when header is gone */}
                        <button className="sidebar-toggle-floating" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={22} />
                        </button>

                        <div className="messages-scroll-area">
                            {messages.length === 0 && !isLoading && (
                                <section className="chat-start-view animate-fade-in">
                                    <div className="brand-badge">Conversando com Deus</div>
                                    <div className="start-icon-premium">
                                        <Sparkles size={40} className="sparkle-animate" />
                                    </div>
                                    {user ? (
                                        <>
                                            <h2>Olá! Como posso te ajudar hoje?</h2>
                                            <p>Suas conversas agora são salvas individualmente no seu histórico ao lado. Escolha um tema abaixo ou peça uma orientação bíblica.</p>
                                        </>
                                    ) : (
                                        <>
                                            <h2>Como posso te ajudar hoje?</h2>
                                            <p>Este é um espaço seguro. Escolha um tema abaixo ou escreva sua própria dúvida para iniciarmos.</p>
                                        </>
                                    )}

                                    <div className="start-suggestion-box">
                                        <SuggestionChips onSelect={(t) => handleQuickPrompt(t.id)} />
                                    </div>
                                </section>
                            )}

                            {messages.map((msg, index) => (
                                <MessageBubble
                                    key={index}
                                    message={msg}
                                    onBookmark={handleBookmark}
                                    isBookmarked={bookmarks.includes(msg.content)}
                                />
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
                        {!isPremium && user && (
                            <div className="usage-indicator animate-fade-in">
                                <div className="usage-progress-text">
                                    <span>{Math.max(0, DAILY_LIMIT - messageCountToday)} de {DAILY_LIMIT} mensagens gratuitas restantes</span>
                                    <Link to="/planos" className="upgrade-link">
                                        <Crown size={14} />
                                        Seja Premium
                                    </Link>
                                </div>
                                <div className="usage-bar">
                                    <div 
                                        className="usage-bar-fill" 
                                        style={{ width: `${Math.min(100, (messageCountToday / DAILY_LIMIT) * 100)}%` }}
                                    ></div>
                                </div>
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
            {/* Modal de Limite (Paywall) */}
            <LimitModal 
                isOpen={isLimitModalOpen} 
                onClose={() => setIsLimitModalOpen(false)} 
            />
        </div>
    );
}

export default Chat;
