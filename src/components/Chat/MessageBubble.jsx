import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Copy, Check, Sparkles, Bookmark, BookmarkCheck } from 'lucide-react';
import './MessageBubble.css';

const MessageBubble = ({ message, isStreaming = false, onBookmark = null, isBookmarked = false }) => {
    const isAssistant = message.role === 'assistant';
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`message-wrapper ${isAssistant ? 'assistant' : 'user'}`}>
            <div className="message-container">
                <div className="message-avatar-group">
                    {isAssistant ? (
                        <div className="avatar-ai"><Sparkles size={18} /></div>
                    ) : (
                        <div className="avatar-user"><User size={20} /></div>
                    )}
                </div>

                <div className="message-bubble-body">
                    <span className="sender-label">
                        {isAssistant ? "Assistente" : "Você"}
                    </span>

                    <div className="bubble-content">
                        <div className="message-text">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                            {isStreaming && <span className="streaming-tick"></span>}
                        </div>

                        {isAssistant && message.content && !isStreaming && (
                            <div className="bubble-actions">
                                <button className="btn-copy-bubble" onClick={handleCopy}>
                                    {copied ? (
                                        <><Check size={14} /> Copiado</>
                                    ) : (
                                        <><Copy size={14} /> Copiar</>
                                    )}
                                </button>

                                {onBookmark && (
                                    <button
                                        className={`btn-bookmark-bubble ${isBookmarked ? 'active' : ''}`}
                                        onClick={() => onBookmark(message)}
                                        disabled={isBookmarked}
                                    >
                                        {isBookmarked ? (
                                            <><BookmarkCheck size={14} /> Salvo</>
                                        ) : (
                                            <><Bookmark size={14} /> Salvar conselho</>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
