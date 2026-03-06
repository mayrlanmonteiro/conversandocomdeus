import './LoadingDots.css';

export default function LoadingDots() {
    return (
        <div className="loading-dots" aria-label="Processando resposta...">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
        </div>
    );
}
