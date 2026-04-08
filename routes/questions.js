const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/generate", auth, async (req, res) => {
  const { count = 10, weakCategories = [], certId = "google-ai-leadership" } = req.body;

  const weakFocus =
    weakCategories.length > 0
      ? `The user is struggling most with these categories (focus more questions here):\n${weakCategories.map((w) => `- ${w.category} (${w.accuracy}% accuracy)`).join("\n")}`
      : "The user has no prior history — generate a balanced set across all categories.";

  const prompt = `You are an expert exam question writer for the Google AI Leadership certification.

Generate exactly ${count} multiple-choice questions. ${weakFocus}

Categories to draw from:
- Responsible AI
- Google AI Principles
- LLM Concepts
- AI Governance
- AI Leadership

Rules for every question:
1. Each question must have exactly 4 answer options
2. CRITICAL: Vary which option is correct — distribute correct answers roughly evenly across positions 0, 1, 2, and 3. Do NOT make the longest answer always correct.
3. All 4 options must be similar in length — within 10 words of each other
4. Distractors must be plausible, not obviously wrong
5. Include a brief explanation for the correct answer
6. Include a brief explanation for what to study if wrong

Respond ONLY with a valid JSON array, no markdown, no preamble, no code fences:
[
  {
    "category": "Category Name",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 2,
    "feedbackCorrect": "Explanation when correct.",
    "feedbackWrong": "Explanation when wrong."
  }
]`;

  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
    const deployment = process.env.AZURE_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_API_VERSION || "2025-01-01-preview";
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Azure API error:", response.status, errText);
      return res.status(500).json({ error: "Failed to generate questions. Please try again." });
    }

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    res.json({ questions });
  } catch (err) {
    console.error("Question generation error:", err.message);
    res.status(500).json({ error: "Failed to generate questions. Please try again." });
  }
});

module.exports = router;
