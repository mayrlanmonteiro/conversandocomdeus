import React from 'react';
import './SuggestionChips.css';
import { PROMPT_TEMPLATES } from '../../constants/promptTemplates';

export default function SuggestionChips({ onSelect, hideLabel = false }) {
    const suggestions = Object.values(PROMPT_TEMPLATES);

    return (
        <div className={`suggestions-section ${hideLabel ? 'footer-mode' : ''}`}>
            {!hideLabel && <p className="suggestions-label">💡 Comece com um modelo</p>}
            <div className="suggestions-grid">
                {suggestions.map((s) => (
                    <button
                        key={s.id}
                        className="suggestion-chip"
                        onClick={() => onSelect(s)}
                        title={s.title}
                    >
                        <span className="chip-text">{s.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
