export const PROMPT_TEMPLATES = {
    BIBLE_STUDY: {
        id: 'bible-study',
        label: 'Estudo bíblico para célula',
        title: 'Estudo Bíblico em Grupo',
        fields: [
            { id: 'tema', label: 'Tema do estudo (ou texto bíblico)', placeholder: 'Ex: Fé em meio às lutas (Tiago 1:2-4)', required: true },
            { id: 'publico', label: 'Público-alvo', placeholder: 'Ex: Adultos, Jovens, Casais', defaultValue: 'Geral' },
            { id: 'duracao', label: 'Duração (minutos)', placeholder: 'Ex: 45', defaultValue: '45' },
            { id: 'versao', label: 'Versão bíblica preferida', placeholder: 'Ex: NVI, ARA', defaultValue: 'NVI' }
        ],
        generatePrompt: (values) => `
MODO: ESTUDO BÍBLICO EM GERE
Gere um estudo bíblico para ser usado em grupo (célula/pequeno grupo), seguindo esta estrutura:
1) Título do estudo.
2) Texto(s) bíblico(s) base (com referência).
3) Objetivo do estudo em 1 ou 2 frases.
4) Contexto bíblico resumido (histórico e literário).
5) De 3 a 5 pontos principais, explicando o que o texto ensina.
6) De 3 a 5 aplicações práticas para o dia a dia.
7) De 4 a 6 perguntas para reflexão e discussão em grupo.
8) Sugestão de oração curta ao final (para o líder ou o grupo usar).

Adapte a linguagem para um grupo cristão evangélico, com pessoas de diferentes níveis de maturidade na fé.

Tema do estudo: ${values.tema}
Público-alvo: ${values.publico}
Duração aproximada desejada: ${values.duracao} minutos.
Versão bíblica preferida: ${values.versao}
`
    },
    DEVOCIONAL: {
        id: 'devocional',
        label: 'Devocional do dia',
        title: 'Devocional Diário Curto',
        fields: [
            { id: 'tema', label: 'Sobre qual tema/situação você quer meditar hoje?', placeholder: 'Ex: Ansiedade, Gratidão, Salmo 23', required: true },
            { id: 'publico', label: 'Perfil (ex: jovem, adulto, novo na fé)', defaultValue: 'Geral' },
            { id: 'versao', label: 'Versão bíblica preferida', defaultValue: 'NVI' }
        ],
        generatePrompt: (values) => `
MODO: DEVOCIONAL DIÁRIO CURTO
Crie um devocional diário curto seguindo esta estrutura:
1) Título do devocional.
2) Texto bíblico base (1 a 5 versículos, com referência).
3) Meditação em 3 a 6 parágrafos curtos, conectando o texto com a vida diária.
4) 2 ou 3 aplicações práticas simples para o dia de hoje.
5) Sugestão de oração curta (modelo para a pessoa adaptar).

Use linguagem acolhedora e simples. Evite jargões difíceis.

Tema ou situação: ${values.tema}
Público: ${values.publico}
Versão bíblica preferida: ${values.versao}
`
    },
    PREGACAO: {
        id: 'pregacao',
        label: 'Preparar pregação',
        title: 'Pregação / Sermão Temático',
        fields: [
            { id: 'tema', label: 'Tema da pregação', placeholder: 'Ex: O amor de Deus', required: true },
            { id: 'texto', label: 'Texto(s) bíblico(s) principal(is)', placeholder: 'Ex: João 3:16', required: true },
            { id: 'publico', label: 'Tipo de público', placeholder: 'Ex: Igreja local, Jovens, Culto ao ar livre', defaultValue: 'Igreja local' },
            { id: 'tempo', label: 'Tempo aproximado (minutos)', defaultValue: '30' },
            { id: 'versao', label: 'Versão bíblica preferida', defaultValue: 'ARA' }
        ],
        generatePrompt: (values) => `
MODO: PREGAÇÃO TEMÁTICA
Monte um esboço de pregação cristã evangélica, seguindo esta estrutura:
1) Título da mensagem.
2) Texto bíblico base (referência e breve citação ou resumo).
3) Introdução: conectando o tema com a realidade dos ouvintes.
4) De 2 a 4 pontos principais com explicação e ligação com a vida real.
5) Possíveis ilustrações ou exemplos.
6) Aplicações práticas concretas.
7) Conclusão com apelo (fé, arrependimento, esperança).

Não fale como se fosse Deus revelando algo novo; baseie tudo nas Escrituras.

Tema: ${values.tema}
Texto base: ${values.texto}
Público: ${values.publico}
Tempo aproximado: ${values.tempo} minutos.
Versão bíblica preferida: ${values.versao}
`
    },
    CONSELHO: {
        id: 'conselho',
        label: 'Conselho bíblico',
        title: 'Conselho para Situação Difícil',
        fields: [
            { id: 'situacao', label: 'Descreva brevemente a situação', placeholder: 'Ex: Estou passando por um momento de desânimo no trabalho...', required: true }
        ],
        generatePrompt: (values) => `Preciso de um conselho bíblico para a seguinte situação: ${values.situacao}`
    },
    EXPLICAR_TEXTO: {
        id: 'explicar',
        label: 'Explicar um texto bíblico',
        title: 'Explicar Texto da Bíblia',
        fields: [
            { id: 'texto', label: 'Qual texto ou versículo você quer entender melhor?', placeholder: 'Ex: Romanos 8:28', required: true }
        ],
        generatePrompt: (values) => `Poderia me explicar o significado e o contexto do texto bíblico: ${values.texto}?`
    }
};
