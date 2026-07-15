const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

// Permite o acesso do seu HTML de qualquer lugar
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Inicializa o Gemini com a chave de API que você vai colocar no Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/generate-slides', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Texto não fornecido.' });
    }

    const prompt = `
      Você é um especialista em estruturação de apresentações executivas corporativas.
      Analise o texto abaixo e separe-o em slides lógicos com títulos adequados e de fácil leitura.
      
      Regras de Negócio:
      - O primeiro slide (index 0) DEVE ser a capa (use "type": "capa").
      - Os slides seguintes devem ser de conteúdo detalhado (use "type": "content").
      - Crie títulos corporativos limpos e diretos no padrão das imagens.
      - Retorne estritamente um JSON no formato abaixo, sem qualquer formatação markdown extra (não use blocos de código com a palavra "json" ou crases):
      
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

    // Limpeza de segurança de tags markdown caso a IA as retorne
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const slides = JSON.parse(cleanJson);

    return res.json({ slides });

  } catch (error) {
    console.error('Erro no processamento:', error);
    return res.status(500).json({ error: 'Erro ao processar dados no Gemini.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
