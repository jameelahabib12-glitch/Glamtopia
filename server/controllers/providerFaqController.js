const ProviderFAQ = require("../models/ProviderFAQ");

// POST /api/faqs  — provider creates a FAQ entry
// Requires session auth (req.session.user set by your team's authMiddleware)
exports.createFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "question and answer are required" });
    }

    const faq = await ProviderFAQ.create({
      provider_id: req.session.userId, // logged-in provider only
      question,
      answer,
    });

    res.status(201).json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create FAQ" });
  }
};

// GET /api/faqs/:providerId — public, anyone can view a provider's FAQs
exports.getFaqsByProvider = async (req, res) => {
  try {
    const faqs = await ProviderFAQ.find({ provider_id: req.params.providerId }).sort({
      created_at: -1,
    });
    res.json(faqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};

// PUT /api/faqs/:id — provider edits their own FAQ entry
exports.updateFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    const faq = await ProviderFAQ.findOneAndUpdate(
      { _id: req.params.id, provider_id: req.session.userId }, // ownership check
      { ...(question && { question }), ...(answer && { answer }) },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found or not yours" });
    }

    res.json(faq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update FAQ" });
  }
};

// DELETE /api/faqs/:id — provider deletes their own FAQ entry
exports.deleteFaq = async (req, res) => {
  try {
    const faq = await ProviderFAQ.findOneAndDelete({
      _id: req.params.id,
      provider_id: req.session.userId,
    });

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found or not yours" });
    }

    res.json({ message: "FAQ deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete FAQ" });
  }
};