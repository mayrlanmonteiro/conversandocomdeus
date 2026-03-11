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
                <div className="message-bubble-body">
                    <div className="bubble-content">
                        <div className="message-text">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                            {isStreaming && <span className="streaming-tick"></span>}
                        </div>
                    </div>

                    {isAssistant && message.content && !isStreaming && (
                        <div className="bubble-actions">
                            <button className="btn-action-bubble" onClick={handleCopy} title="Copiar">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>

                            {onBookmark && (
                                <button
                                    className={`btn-action-bubble ${isBookmarked ? 'active' : ''}`}
                                    onClick={() => onBookmark(message)}
                                    disabled={isBookmarked}
                                    title="Salvar"
                                >
                                    {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
