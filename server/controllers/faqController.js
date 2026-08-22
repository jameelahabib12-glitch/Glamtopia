const Faq = require("../models/Faq");
const ProviderProfile = require("../models/ProviderProfile");

// GET /api/faqs?providerId=xxx
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
async function askFaq(req, res) {
    try {
        const { question, providerId } = req.body;

        if (typeof question !== "string" || !question.trim()) {
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
            .filter((w) => w.length > 2);

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

        if (typeof question !== "string" || typeof answer !== "string") {
            return res.status(400).json({ message: "question and answer must be text" });
        }
        if (!question.trim() || !answer.trim()) {
            return res.status(400).json({ message: "question and answer are required" });
        }
        if (display_order !== undefined && typeof display_order !== "number") {
            return res.status(400).json({ message: "display_order must be a number" });
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

        if (updates.question !== undefined && typeof updates.question !== "string") {
            return res.status(400).json({ message: "question must be text" });
        }
        if (updates.answer !== undefined && typeof updates.answer !== "string") {
            return res.status(400).json({ message: "answer must be text" });
        }
        if (updates.display_order !== undefined && typeof updates.display_order !== "number") {
            return res.status(400).json({ message: "display_order must be a number" });
        }

        const faq = await Faq.findOneAndUpdate(
            { _id: req.params.id, provider_id: providerId },
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