const Faq = require("../models/Faq");

// GET /api/faqs?providerId=xxx
// Returns general platform FAQs (provider_id: null) plus, if a providerId
// is given, that specific provider's own FAQs on top. Used to populate the
// widget's default "browse" list before the user types anything.
async function listFaqs(req, res) {
    try {
        const { providerId } = req.query;

        const filter = providerId
            ? { $or: [{ provider_id: null }, { provider_id: providerId }] }
            : { provider_id: null };

        const faqs = await Faq.find(filter).sort({ display_order: 1, created_at: 1 });

        return res.status(200).json({ faqs });
    } catch (err) {
        console.error("List FAQs error:", err);
        return res.status(500).json({ message: "Server error while fetching FAQs" });
    }
}

// POST /api/faqs/ask   body: { question: string, providerId?: string }
// Very deliberately simple: this is a fixed-FAQ chatbot, not an NLP engine
// (see SRS FR-13 and Section 8 decision #7 — basic Q&A was the agreed scope).
// It scores each FAQ by how many of the user's words appear in the question,
// and returns the best match if it clears a minimum relevance bar.
async function askFaq(req, res) {
    try {
        const { question, providerId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ message: "A question is required" });
        }

        const filter = providerId
            ? { $or: [{ provider_id: null }, { provider_id: providerId }] }
            : { provider_id: null };

        const faqs = await Faq.find(filter);

        const userWords = question
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 2); // skip tiny filler words like "is", "do"

        let best = null;
        let bestScore = 0;

        for (const faq of faqs) {
            const faqWords = faq.question.toLowerCase();
            let score = 0;
            for (const word of userWords) {
                if (faqWords.includes(word)) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                best = faq;
            }
        }

        if (!best || bestScore === 0) {
            return res.status(200).json({
                matched: false,
                answer:
                    "I don't have an answer for that yet. Try browsing the topics below, or contact the provider directly.",
            });
        }

        return res.status(200).json({
            matched: true,
            question: best.question,
            answer: best.answer,
        });
    } catch (err) {
        console.error("Ask FAQ error:", err);
        return res.status(500).json({ message: "Server error while answering question" });
    }
}

module.exports = { listFaqs, askFaq };
