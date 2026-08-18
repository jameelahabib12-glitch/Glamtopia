const Faq = require("../models/Faq");
const ProviderProfile = require("../models/ProviderProfile");

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

// -----------------------------------------------------------------------
// Everything below this line = Eeman's Week 2 Day-3 addition (Task 3).
// Lets a logged-in provider manage their OWN FAQ entries on the shared
// Faq collection. provider_id is always resolved server-side from the
// session — never trust a provider_id sent in the request body, or one
// provider could write into another provider's FAQ list.
// -----------------------------------------------------------------------

async function getMyProviderProfileId(userId) {
    const profile = await ProviderProfile.findOne({ user_id: userId });
    return profile ? profile._id : null;
}

// POST /api/faqs — provider adds a FAQ entry to their own profile
async function createProviderFaq(req, res) {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "Create your provider profile before adding FAQs" });
        }

        const { question, answer, display_order } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ message: "question and answer are required" });
        }

        const faq = await Faq.create({
            provider_id: providerId,
            question: question.trim(),
            answer: answer.trim(),
            display_order: display_order || 0,
        });

        return res.status(201).json(faq);
    } catch (err) {
        console.error("Create provider FAQ error:", err);
        return res.status(500).json({ message: "Failed to create FAQ" });
    }
}

// PATCH /api/faqs/:id — provider edits their own FAQ entry
async function updateProviderFaq(req, res) {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const allowedFields = ["question", "answer", "display_order"];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        const faq = await Faq.findOneAndUpdate(
            { _id: req.params.id, provider_id: providerId }, // ownership check — can't be null (general FAQs), must match this provider
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({ message: "FAQ not found or not yours" });
        }

        return res.status(200).json(faq);
    } catch (err) {
        console.error("Update provider FAQ error:", err);
        return res.status(500).json({ message: "Failed to update FAQ" });
    }
}

// DELETE /api/faqs/:id — provider deletes their own FAQ entry
// (Real delete here, not archive — FAQs aren't tied to booking history like
// services are, so there's no reason to keep a deleted one around.)
async function deleteProviderFaq(req, res) {
    try {
        const providerId = await getMyProviderProfileId(req.session.userId);
        if (!providerId) {
            return res.status(400).json({ message: "You don't have a provider profile" });
        }

        const faq = await Faq.findOneAndDelete({
            _id: req.params.id,
            provider_id: providerId,
        });

        if (!faq) {
            return res.status(404).json({ message: "FAQ not found or not yours" });
        }

        return res.status(200).json({ message: "FAQ deleted" });
    } catch (err) {
        console.error("Delete provider FAQ error:", err);
        return res.status(500).json({ message: "Failed to delete FAQ" });
    }
}

module.exports = {
    listFaqs,
    askFaq,
    createProviderFaq,
    updateProviderFaq,
    deleteProviderFaq,
};