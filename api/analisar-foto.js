import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Só permite chamadas do tipo POST (envio de dados)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { image, mimeType } = req.body;
    
    // 2. Usa a chave que vamos configurar no painel do Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Analise esta foto de produto de moda. Retorne APENAS um objeto JSON com: nome, preco (numérico) e descricao curta.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: mimeType || "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    return res.status(200).json({ result: text });
  } catch (error) {
    console.error("Erro na API:", error);
    return res.status(500).json({ error: "Falha ao processar imagem" });
  }
}