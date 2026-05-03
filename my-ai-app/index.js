const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const Groq = require('groq-sdk');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Memory store
let memory = {};

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const systemPrompt = `You are a helpful AI assistant with these abilities:
1. TEACHER: When asked "teach me X", break into 5 lessons, teach one at a time
2. CALCULATOR: Solve any math problem
3. WEATHER: Give realistic mock weather for any city
4. GENERAL: Answer any question clearly
5. MEMORY: Remember user's name and preferences

Current memory: ${JSON.stringify(memory)}

Be friendly, clear and helpful. Use examples and analogies.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // Check if user is sharing info to remember
    if (message.toLowerCase().includes('my name is')) {
      const name = message.split('my name is')[1].trim().split(' ')[0];
      memory.name = name;
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply, memory });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ My AI App running at http://localhost:${PORT}`);
});