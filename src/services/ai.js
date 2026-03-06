import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from '../constants/systemPrompt';

// Carrega a chave e o modelo das variáveis de ambiente
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_AI_MODEL || "gemini-1.5-flash-latest";

// Inicializa o SDK do Google
if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY não encontrada no .env");
}
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Envia o histórico de mensagens para a IA usando o SDK oficial do Google Gemini.
 * @param {Array} messages - Array de objetos {role, content}
 * @param {Function} onChunk - Callback para cada pedaço de texto (streaming)
 * @param {Function} onDone - Callback de conclusão
 * @param {Function} onError - Callback de erro
 */
export async function sendMessageStream(messages, onChunk, onDone, onError) {
    try {
        // 1. Configura o modelo com as instruções de sistema
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: SYSTEM_PROMPT
        });

        // 2. Converte o histórico para o formato do SDK (role: 'user' ou 'model')
        // Removemos a última mensagem para passá-la como 'sendMessage'
        const history = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const lastMessage = messages[messages.length - 1].content;

        // 3. Inicia o chat com histórico
        const chat = model.startChat({
            history: history,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            },
        });

        // 4. Envia a mensagem com streaming
        const result = await chat.sendMessageStream(lastMessage);

        // 5. Processa o stream
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                onChunk(chunkText);
            }
        }

        onDone();
    } catch (err) {
        console.error("Erro na API Gemini SDK:", err);

        // Tratamento amigável de erros comuns
        let userFriendlyError = "Houve um problema ao conectar com o assistente.";

        if (err.message?.includes("not found")) {
            userFriendlyError = `O modelo '${MODEL_NAME}' não foi encontrado. Tente mudar para 'gemini-1.5-flash' no seu arquivo .env.`;
        } else if (err.message?.includes("API key")) {
            userFriendlyError = "Sua API Key parece inválida ou não tem permissão.";
        }

        onError(userFriendlyError);
    }
}
