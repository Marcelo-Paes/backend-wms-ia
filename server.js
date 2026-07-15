const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração de CORS para permitir requisições de qualquer origem
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// O Render injeta as variáveis de ambiente direto no process.env, sem precisar de dotenv
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("AVISO: A variável GEMINI_API_KEY não foi encontrada no ambiente!");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

app.post('/generate-slides', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Texto bruto (rawText) não fornecido.' });
    }

    const prompt = `
      Você é um especialista em estruturação de apresentações executivas corporativas e logísticas.
      Analise o texto abaixo e separe-o em slides lógicos com títulos adequados, profissionais e de fácil leitura.
      
      Regras estritas de Negócio:
      - O primeiro slide (index 0) DEVE ser a capa (use obrigatoriamente "type": "capa").
      - Os slides seguintes devem ser de conteúdo detalhado (use obrigatoriamente "type": "content").
      - Extraia títulos executivos limpos baseados nos tópicos do texto.
      - Cada slide de conteúdo deve ter no máximo 3 bullets claros e diretos.
      - Retorne estritamente um array JSON válido no formato abaixo. Não adicione nenhuma formatação markdown extra, nenhuma crase, e não escreva a palavra "json":
      
      [
        { "type": "capa", "title": "Título Principal da Capa", "subtitle": "Legenda ou subtexto explicativo" },
        { "type": "content", "title": "Título do Slide", "bullets": ["Ponto chave 1", "Ponto chave 2", "Ponto chave 3"] }
      ]

      Texto para analisar:
      "${rawText}"
    `;

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Limpeza profunda de tags markdown
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const slides = JSON.parse(cleanJson);

    return res.json({ slides });

  } catch (error) {
    console.error('Erro no processamento com Gemini:', error);
    return res.status(500).json({ error: 'Erro ao processar dados na Inteligência Artificial.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor WMS ativo e rodando na porta ${PORT}`);
});
