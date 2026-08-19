const express = require("express");
const router = express.Router();
const { listFaqs, askFaq } = require("../controllers/faqController");

router.get("/", listFaqs);
router.post("/ask", askFaq);

module.exports = router;
