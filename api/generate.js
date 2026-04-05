export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, vibe } = req.body;

  if (!message || !vibe) {
    return res.status(400).json({ error: 'Missing message or vibe' });
  }

  const vibeDescriptions = {
    'Softly Busy': 'warm but gently unavailable — apologetic but clearly not rearranging your life for this',
    'Lowkey Unavailable': 'chill and unbothered — not rude, just clearly has better things going on',
    'Chronically Booked': 'politely overwhelmed — life is full, no hard feelings, maybe another time'
  };

  const prompt = `Someone sent me this message: "${message}"

Generate exactly 3 short, nonchalant reply options with a "${vibe}" vibe (${vibeDescriptions[vibe]}).

Rules:
- Each reply must be 1-2 sentences max
- Tone: casual, unbothered, never rude or mean
- No excessive apologies or groveling
- Feel like something a cool, genuinely busy person would actually send
- Vary the phrasing across all 3 options — don't repeat the same structure
- Do NOT use quotation marks around the replies

Respond ONLY with a JSON array of exactly 3 strings. No markdown, no code blocks, no extra text. Just raw JSON like: ["reply1","reply2","reply3"]`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        temperature: 0.85,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const replies = JSON.parse(clean);

    return res.status(200).json({ replies });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate replies' });
  }
}
