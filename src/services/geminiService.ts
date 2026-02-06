
import { GoogleGenAI } from "@google/genai";

export const diagnoseVehicleIssue = async (make: string, model: string, symptoms: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key no configurada. Por favor configure su variable de entorno.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Actúa como un mecánico experto senior. 
    Vehículo: ${make} ${model}.
    Síntomas reportados: "${symptoms}".
    
    Por favor, proporciona:
    1. Un diagnóstico probable (lista de 3 posibilidades).
    2. Pasos recomendados para verificar.
    3. Una estimación de dificultad (Baja/Media/Alta).
    
    Responde en formato Markdown limpio y conciso en Español.`;

    // Upgrading to gemini-3-pro-preview for complex reasoning tasks like medical or mechanical diagnosis.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "No se pudo generar un diagnóstico.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Ocurrió un error al consultar el servicio de IA.";
  }
};
