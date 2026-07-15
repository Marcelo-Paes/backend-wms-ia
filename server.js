const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(apiKey);

app.post('/generate-slides', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Texto bruto (rawText) não fornecido.' });
    }

    if (!apiKey) {
      throw new Error("A chave GEMINI_API_KEY não está configurada no Render.");
    }

    const prompt = `
      Você é um especialista em apresentações executivas logísticas.
      Analise o texto abaixo e retorne ESTRITAMENTE um array JSON. 
      Não escreva NENHUMA palavra antes ou depois do JSON. Não use formatação markdown (sem \`\`\`json).
      
      [
        { "type": "capa", "title": "Título", "subtitle": "Subtítulo" },
        { "type": "content", "title": "Tópico", "bullets": ["Ponto 1", "Ponto 2"] }
      ]

      Texto:
      "${rawText}"
    `;

    // CORREÇÃO AQUI: Usando o modelo universal "gemini-pro" que não dá erro 404
    const model = ai.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("Resposta bruta da IA:", responseText);

    // Filtro à prova de balas
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("A IA não retornou um formato de array JSON válido.");
    }

    const slides = JSON.parse(jsonMatch[0]);

    return res.json({ slides });

  } catch (error) {
    console.error('Detalhe do Erro 500:', error.message);
    return res.status(500).json({ error: `Falha interna: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor WMS ativo e rodando na porta ${PORT}`);
});
