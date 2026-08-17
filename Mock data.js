/**
 * Mock data layer — stands in for the real /api/providers endpoints.
 * Field names deliberately mirror the ERD (Glamtopia_ERD_Final) so swapping
 * this file for a real fetch() call later is a like-for-like replacement:
 *   provider_profiles  -> PROVIDERS
 *   services            -> PROVIDERS[i].services
 * "fully_booked" here is a hardcoded flag for the skeleton only — per SRS
 * Section 8, in the real system this is computed live against
 * availability_slots (any booked:false slot with a future start_time),
 * never stored.
 */

const CATEGORIES = ["hair", "makeup", "nails", "skincare"]; // fixed enum per SRS Open Questions

const PROVIDERS = [
  {
    id: "p1",
    business_name: "Noor Hair Studio",
    bio: "Specialists in Balayage, keratin treatments, and bridal hairstyling for over 8 years.",
    location: "Hayatabad, Peshawar",
    category: "hair",
    contact_info: "0300-1234567",
    profile_image_url: null,
    average_rating: 4.8,
    review_count: 132,
    fully_booked: false,
    services: [
      { id: "s1", name: "Haircut & Style", description: "Wash, cut, and blow-dry finish.", duration_minutes: 60, price: 1500 },
      { id: "s2", name: "Balayage Color", description: "Hand-painted highlights with gloss.", duration_minutes: 180, price: 8500 },
      { id: "s3", name: "Bridal Hairstyling", description: "Trial included, on-location available.", duration_minutes: 120, price: 12000 }
    ]
  },
  {
    id: "p2",
    business_name: "Ayesha's Makeover",
    bio: "Editorial and bridal makeup artist trained in HD and airbrush techniques.",
    location: "University Town, Peshawar",
    category: "makeup",
    contact_info: "0311-2223344",
    profile_image_url: null,
    average_rating: 4.9,
    review_count: 208,
    fully_booked: true,
    services: [
      { id: "s4", name: "Party Makeup", description: "Full face, false lashes included.", duration_minutes: 60, price: 3500 },
      { id: "s5", name: "HD Bridal Makeup", description: "Includes hair styling add-on.", duration_minutes: 150, price: 15000 }
    ]
  },
  {
    id: "p3",
    business_name: "Glow & Grace Skin Clinic",
    bio: "Facials, threading, and skin consultations using dermatologist-approved products.",
    location: "Gulberg, Peshawar",
    category: "skincare",
    contact_info: "0333-4455667",
    profile_image_url: null,
    average_rating: 4.6,
    review_count: 76,
    fully_booked: false,
    services: [
      { id: "s6", name: "Classic Facial", description: "Deep cleanse, steam, and mask.", duration_minutes: 45, price: 2000 },
      { id: "s7", name: "Full Face Threading", description: "Eyebrows, upper lip, and forehead.", duration_minutes: 20, price: 500 }
    ]
  },
  {
    id: "p4",
    business_name: "Polished Nail Bar",
    bio: "Gel extensions, nail art, and classic manicure-pedicure sets.",
    location: "Saddar, Peshawar",
    category: "nails",
    contact_info: "0345-9988776",
    profile_image_url: null,
    average_rating: 4.7,
    review_count: 54,
    fully_booked: false,
    services: [
      { id: "s8", name: "Gel Manicure", description: "Shellac finish, 20+ color options.", duration_minutes: 45, price: 1800 },
      { id: "s9", name: "Nail Art (per set)", description: "Custom design, priced per hand.", duration_minutes: 60, price: 2500 }
    ]
  },
  {
    id: "p5",
    business_name: "The Cutting Edge",
    bio: "Men's and women's precision haircuts, keratin, and hair spa treatments.",
    location: "Cantt, Peshawar",
    category: "hair",
    contact_info: "0300-7766554",
    profile_image_url: null,
    average_rating: 4.4,
    review_count: 41,
    fully_booked: false,
    services: [
      { id: "s10", name: "Hair Spa", description: "Deep conditioning treatment.", duration_minutes: 60, price: 2200 },
      { id: "s11", name: "Precision Haircut", description: "Consultation and finish included.", duration_minutes: 45, price: 1200 }
    ]
  },
  {
    id: "p6",
    business_name: "Radiance Beauty Lounge",
    bio: "One-stop lounge for makeup, skincare, and quick touch-ups before events.",
    location: "Hayatabad, Peshawar",
    category: "makeup",
    contact_info: "0321-1122334",
    profile_image_url: null,
    average_rating: 4.5,
    review_count: 97,
    fully_booked: false,
    services: [
      { id: "s12", name: "Everyday Glam", description: "Light coverage, natural finish.", duration_minutes: 45, price: 2500 },
      { id: "s13", name: "Event Touch-Up", description: "30-min refresh, on-site.", duration_minutes: 30, price: 1000 }
    ]
  }
];

/** Simulated network calls — swap the body for a real fetch() later. */
const MockAPI = {
  async getProviders() {
    return structuredClone(PROVIDERS);
  },
  async getProviderById(id) {
    const found = PROVIDERS.find((p) => p.id === id);
    return found ? structuredClone(found) : null;
  }
};