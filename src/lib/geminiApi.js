export async function fetchGeminiSubtopics(topic) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Missing Gemini API Key');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `List the key subtopics and concepts within the academic topic "${topic}". Return ONLY a valid JSON array of strings with 8 to 14 items. No explanation, no markdown, no code fences — just the raw JSON array. Example: ["Subtopic A","Subtopic B","Subtopic C"]`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const subtopics = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return subtopics;
}
