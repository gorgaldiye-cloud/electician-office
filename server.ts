import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Electrical Diagnostic API route using gemini-4-argon with high thinking
app.post('/api/diagnose', async (req, res) => {
  try {
    const { problemDescription, applianceDetails, symptoms, language } = req.body;

    if (!problemDescription || typeof problemDescription !== 'string') {
      res.status(400).json({ error: 'problemDescription is required' });
      return;
    }

    const lang = language === 'ur' ? 'Urdu' : 'English';

    const prompt = `
You are a master electrical engineer and certified electrical safety inspector for ABC Electrician Services in Pakistan.
The user is experiencing an electrical issue or inquiry at their home or commercial facility.

User Report:
- Problem: "${problemDescription}"
- Additional Symptoms: "${symptoms || 'None provided'}"
- Appliances Involved: "${applianceDetails || 'Not specified'}"
- Response Language requested: ${lang}

Analyze this situation thoroughly with high analytical rigor:
1. Identify immediate life-safety hazards (e.g. risk of electrical shock, fire hazard, arc flash, burning smell, short circuit).
2. Give clear, calm, urgent safety instructions (e.g., whether to safely isolate the main breaker or keep away).
3. Assess the probable root causes (e.g. neutral fault, loose breaker terminal, overload, short-circuit, ground-fault leakage, surge damage, low voltage).
4. Provide practical guidance and triage urgency: STANDARD, URGENT, or EMERGENCY.
5. Recommend the specific service category (e.g. Breaker & Distribution Board Repair, Wiring & Short Circuit Triage, Solar/Inverter Wiring, Commercial Three-Phase Inspection).

Always include a clear disclaimer that electrical work in Pakistan requires certified, licensed technicians and the user must not touch live wires.
Provide a structured, helpful, professional response formatted with clean headers and bullet points in ${lang}.
`;

    // Try gemini-4-argon with high thinking level as specified
    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('gemini-4-argon call failed, falling back to gemini-3.8-flash:', primaryErr?.message);
      // Fallback model to ensure robust response if argon requires paid key or is temporarily unavailable
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      responseText = fallbackResponse.text || '';
    }

    res.json({
      success: true,
      analysis: responseText,
      disclaimer: lang === 'Urdu'
        ? 'یہ تجزیہ صرف معلوماتی اور حفاظتی رہنمائی کے لیے ہے۔ براہ کرم ننگے تاروں کو مت چھوئیں اور ہمارے تصدیق شدہ الیکٹریشن سے رابطہ کریں۔'
        : 'This diagnosis is for safety guidance and estimation. Electrical repairs must be performed by certified technicians. Do not touch exposed wiring.',
    });
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      error: 'Failed to process diagnostic analysis',
      message: error.message || 'Service error',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ABC Electrician Services API' });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
