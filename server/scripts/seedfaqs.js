
require("dotenv").config();
const connectDB = require("../config/db");
const Faq = require("../models/Faq");
 
const GENERAL_FAQS = [
  {
    question: "Do I need an account to browse providers?",
    answer:
      "No — you can browse, search, and view provider profiles as a guest. You'll only need to log in or sign up when you're ready to book an appointment.",
    category: "account",
    display_order: 1,
  },
  {
    question: "How do I book an appointment?",
    answer:
      "Open a provider's profile, pick a service, and choose an open time slot. You'll be asked to log in or create an account at that point, then you'll confirm the booking.",
    category: "booking",
    display_order: 2,
  },
  {
    question: "How do I create an account?",
    answer:
      "Tap Sign up, choose whether you're a customer or a provider, and fill in your details. Customers also need a phone number so providers can reach them about their booking.",
    category: "account",
    display_order: 3,
  },
  {
    question: "Can I cancel or reschedule a booking?",
    answer:
      "Yes — go to your bookings from your account, and you'll see cancel and reschedule options for any upcoming appointment, subject to the provider's notice window.",
    category: "booking",
    display_order: 4,
  },
  {
    question: "What happens if a provider is fully booked?",
    answer:
      "Their profile will show \"Fully booked\" with their next expected availability. You can check back later, or browse similar providers in the same category and area.",
    category: "booking",
    display_order: 5,
  },
  {
    question: "How do I know a provider is legitimate?",
    answer:
      "Every provider profile shows verified ratings and review counts from past customers, along with their service list and pricing, so you can compare before booking.",
    category: "general",
    display_order: 6,
  },
  {
    question: "What areas does Glamtopia cover?",
    answer:
      "Right now we're focused on Peshawar, with providers across areas like Hayatabad, University Town, Saddar, Gulberg, and Cantt. You can filter by location while browsing.",
    category: "general",
    display_order: 7,
  },
  {
    question: "Is my personal information safe?",
    answer:
      "Yes — your password is encrypted, and we only share your contact details with a provider once you actually book an appointment with them.",
    category: "account",
    display_order: 8,
  },
  {
    question: "How do I become a provider on Glamtopia?",
    answer:
      "Sign up and choose \"I'm a provider\" instead of customer. You'll be able to set up your profile, services, pricing, and availability from your provider dashboard.",
    category: "general",
    display_order: 9,
  },
  {
    question: "What if I don't see an answer to my question here?",
    answer:
      "Type your question directly into the chat box above — the assistant will try to match it to an answer. If it can't, reach out to the specific provider directly from their profile page.",
    category: "general",
    display_order: 10,
  },
];
 
async function seed() {
  await connectDB();
 
  const deleted = await Faq.deleteMany({ provider_id: null });
  console.log(`Cleared ${deleted.deletedCount} existing general FAQ(s).`);
 
  const inserted = await Faq.insertMany(
    GENERAL_FAQS.map((faq) => ({ ...faq, provider_id: null }))
  );
  console.log(`Inserted ${inserted.length} general FAQ(s).`);
 
  process.exit(0);
}
 
seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
 
