"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Clock,
  MessageSquare,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  FileText,
} from "lucide-react";
import type { ProductItem } from "@/lib/store";

interface ProductKnowledgeModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OFFICIAL_KB_VERSION = "truehive-official-v2";

const DEFAULT_ENGLISH_KB_BY_SKU: Record<string, any> = {
  "TH-PRD-6068": {
    version: OFFICIAL_KB_VERSION,
    tagline:
      "EverYoung Protect — Cold-Pressed Black Seed Oil (Nigella Sativa) | Daily Support (4.7★ | 1,150+ Reviews)",
    howToUse:
      "SUGGESTED USE: Take 1 serving (1 ml / approx. 30 drops) using the syringe provided, preferably on an empty stomach in the morning.\nMIX OR DIRECT: Take directly or mix with lukewarm water and a spoonful of TrueHive Honey to soften the taste.\nROUTINE: Take every morning as part of your daily wellness routine.",
    servings:
      "150 Servings per 100 ml bottle | Serving Size: 1 ml (Approx. 30 Drops = 1000 mg Black Seed Oil & 10 mg Thymoquinone)",
    bestTimeToUse: "Morning on an empty stomach as part of your daily routine",
    storage:
      "Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken.",
    ingredients:
      "100% pure cold-pressed Nigella sativa (Black Seed) oil, extracted without heat or chemical solvents to retain natural Thymoquinone.\nActive Composition per 1 ml Serving (Approx. 30 Drops): Black Seed Oil (Nigella sativa) 1000 mg, Thymoquinone (TQ) 10 mg.",
    mfgDate: "2026-06-19",
    expDate: "2028-06-19",
    shelfLife: "24 Months (Unopened) / 1–3 Months after opening",
    precautions:
      "Consult your doctor or pharmacist before use if you are pregnant, breastfeeding, taking medication or have a medical condition. Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken. Protect is a wellness product, not a medicine, and is intended to complement a balanced diet and healthy lifestyle.",
    pairings:
      "Mix with a spoonful of TrueHive Honey to soften the taste. Also available in the EverYoung Protect Bundle (Includes Honey + Protect + Sleep for LKR 12,000 — Save LKR 500 off LKR 12,500).",
    benefits: [
      "100% Cold-Pressed: Extracted from Nigella sativa seeds without heat or chemical solvents",
      "Contains Thymoquinone (TQ): Naturally provides 10 mg Thymoquinone and 1000 mg Black Seed Oil per 1 ml serving",
      "Daily Immune & Antioxidant Support: Formulated to support normal immune function, antioxidant protection, general vitality, and everyday wellbeing",
      "Measured 1 ml Serving: Comes with a precision syringe (1 ml / ~30 drops) for effortless daily dosing",
      "Pairs with Honey: Mix with a spoonful of TrueHive Honey to soften the strong natural taste",
      "Double Lab-Tested: Verified by Analytical Reference Laboratory (Report No: ARL/TR/26/042, Issued 19 June 2026)",
    ],
    reviews: [
      {
        author: "Marcus Fernando (Fitness Instructor)",
        text: "My immune system used to take a hit during seasonal changes. Taking PROTECT daily has kept me in peak shape year-round. It's strong but extremely pure.",
      },
      {
        author: "Sachie Weerasinghe (Homemaker)",
        text: "A wonderful health support. I mix it with a bit of wild bee honey, and it has made a remarkable difference in my joints and overall energy levels.",
      },
      {
        author: "Dinithi Silva (Entrepreneur)",
        text: "Protect has become a daily wellness habit for me. I love knowing I'm using natural ingredients as part of my healthy lifestyle.",
      },
      {
        author: "Amanda Lee (Marketing Manager)",
        text: "I prefer natural wellness products, and Protect has exceeded my expectations. The quality and taste are excellent.",
      },
      {
        author: "Ishara Samarasinghe (HR Manager)",
        text: "Protect is an easy addition to my daily routine. I appreciate the premium quality and natural ingredients.",
      },
      {
        author: "James Peterson (Financial Analyst)",
        text: "Protect has become one of the wellness products I never miss. I like the premium packaging and overall quality.",
      },
    ],
    otherDetails:
      "THE SCIENCE OF PROTECT: Protect is cold-pressed black seed oil from Nigella sativa seeds, naturally containing thymoquinone. Extracted without heat or chemical solvents.\nDELIVERY & GUARANTEE: Nationwide Free Delivery (processed within 1–3 business days). Cash on Delivery or card payment available. Backed by a 1-Month 100% Money-Back Guarantee.",
    customSpecs: [
      { label: "Official Product Name", value: "EverYoung Protect (The Core 4 — Daily Support)" },
      { label: "Volume & Servings", value: "100 ml Bottle | 150 Servings (1 ml / ~30 drops per serving)" },
      { label: "Active Compounds (per 1 ml)", value: "Black Seed Oil 1000 mg | Thymoquinone (TQ) 10 mg" },
      { label: "Extraction Method", value: "Cold-Pressed without Heat or Chemical Solvents" },
      { label: "Lab Report Reference", value: "ARL/TR/26/042 — Analytical Reference Laboratory (19 June 2026)" },
      { label: "Customer Rating", value: "4.7 / 5.0 Stars (1,150+ Customer Reviews)" },
      { label: "Recommended Bundle", value: "EverYoung Protect Bundle (Honey + Protect + Sleep) — LKR 12,000 (Save LKR 500)" },
      { label: "Delivery & Guarantee", value: "Nationwide Free Delivery (1–3 Days) | 1-Month 100% Money-Back Guarantee" },
    ],
  },
  "TH-PRD-3628": {
    version: OFFICIAL_KB_VERSION,
    tagline:
      "Pure Honey Reserve — Wild-Harvested Raw Ceylon Bee Honey with Traceable Sourcing (4.8★ | 1,240+ Reviews)",
    howToUse:
      "MEASURE: Add a few drops or a spoonful of Honey to your beverage using the dropper.\nCONSUME: Mix well into lukewarm milk, tea, or water, or drizzle over breakfast and desserts. Avoid adding it to boiling hot liquids, as high heat can denature the honey's beneficial enzymes.\nCONSISTENCY: Enjoy daily in moderation as part of a balanced diet.",
    servings:
      "150 Servings per 100 ml bottle | Key Nutrients per 1g: Energy 3 kcal, Natural Sugars 0.82 g, High Polyphenols & Live Bioactive Enzymes",
    bestTimeToUse:
      "Daily morning ritual, pre-workout natural energy boost, or mixed with lukewarm tea, water, or TrueHive Protect",
    storage: "Store in a cool, dry place at room temperature. Avoid boiling hot liquids.",
    ingredients:
      "100% Pure Raw Ceylon Bee Honey wild-harvested from Sri Lankan forest hives. Never pasteurised or ultra-filtered, retaining natural floral pollen and bioactive bio-enzymes (such as invertase and diastase) and polyphenol antioxidants.\nKey Nutrients per 1g: Energy 3 kcal, Natural Sugars 0.82 g, Antioxidants: High in Polyphenols, Bioactive Enzymes: Live & Active.",
    mfgDate: "2026-06-19",
    expDate: "2029-06-19",
    shelfLife: "36 Months (Pure raw honey naturally preserves when stored in a cool, dry place)",
    precautions:
      "Consult your physician if pregnant, nursing, or on medication. Not suitable for infants under 12 months. If you have diabetes or another medical condition, ask your doctor how much sugar, including honey, is right for you. Do not mix into boiling hot liquids.",
    pairings:
      "Pair with TrueHive Protect (Black Seed Oil) to soften the taste and support daily immunity. Available in Pure Honey Bundle (Honey + Honey Mini for LKR 6,000 — Save LKR 500), EverYoung Protect Bundle (LKR 12,000), and EverYoung Grow Bundle (LKR 9,000).",
    benefits: [
      "Natural Energy: Honey's natural sugars provide clean energy (about 3 kcal per gram) with no crash",
      "Never Pasteurised or Ultra-Filtered: Bottled with minimal processing so it stays close to how it left the forest hive",
      "Retains Bioactive Bio-Enzymes & Pollens: Naturally contains live enzymes (invertase and diastase), wild floral pollen, and high polyphenol antioxidants",
      "Healthy Sugar Alternative: Use in place of refined white sugar in lukewarm drinks, tea, breakfast, and recipes",
      "Smooth Floral Taste: Rich, authentic floral flavour harvested from Sri Lankan forest hives",
      "Double Lab-Tested: Verified by Analytical Reference Laboratory (Report Nos: ARL/TR/26/038 & ARL/TR/26/039, Issued 19 June 2026)",
    ],
    reviews: [
      {
        author: "Diluka Weerasooriya (Endurance Athlete)",
        text: "I've replaced my pre-workout powders with a shot of TrueHive Honey. No crash, just clean energy for my 10-mile runs. Plus, the taste is surprisingly addictive.",
      },
      {
        author: "Isuru Liyanage (Software Engineer)",
        text: "As someone with chronic digestive issues, I was skeptical. Two weeks in, and the bloating is completely gone. This has become my indispensable morning ritual.",
      },
      {
        author: "Sampath Anuradha (Fitness Coach)",
        text: "Quality is everything in my line of work. TrueHive provides the transparency I need for my clients. The combination of Ceylon honey and Black Seed is simply revolutionary for inflammation.",
      },
      {
        author: "Nimal Perera (Chartered Accountant)",
        text: "Has become part of my morning routine. I feel more refreshed and focused throughout my busy workday without relying on multiple cups of coffee.",
      },
      {
        author: "Michael Anderson (Business Consultant)",
        text: "I travel frequently for work, and it helps me stay energized during long meetings. It's now always in my travel bag.",
      },
      {
        author: "Tharindu Wijesinghe (Fitness Trainer)",
        text: "Gives me a natural boost before my morning workouts. I appreciate that it fits well into my wellness routine.",
      },
    ],
    otherDetails:
      "THE SCIENCE OF HONEY: Wild-harvested Ceylon bee honey from Sri Lankan forest hives, bottled with minimal processing. Never pasteurised or ultra-filtered.\nAVAILABLE SIZES ON TRUEHIVE.LK: 20ml Trial, 100ml Standard, and 200ml.\nDELIVERY & GUARANTEE: Nationwide Free Delivery (1–3 business days), Cash on Delivery, 1-Month 100% Money-Back Guarantee.",
    customSpecs: [
      { label: "Official Product Name", value: "Pure Honey Reserve (The Core 4 — Purity & Origin)" },
      { label: "Volume & Servings", value: "100 ml Bottle | 150 Servings" },
      { label: "Origin & Sourcing", value: "Wild-Harvested from Sri Lankan Forest Hives" },
      { label: "Processing", value: "100% Raw, Never Pasteurised, Never Ultra-Filtered" },
      { label: "Nutrients per 1g", value: "3 kcal Energy | 0.82g Natural Sugars | High Polyphenols | Live Invertase & Diastase Enzymes" },
      { label: "Lab Report Reference", value: "ARL/TR/26/038 & ARL/TR/26/039 — Analytical Reference Laboratory (19 June 2026)" },
      { label: "Customer Rating", value: "4.8 / 5.0 Stars (1,240+ Customer Reviews)" },
      { label: "Bundle Offers", value: "Pure Honey Bundle (LKR 6,000) | EverYoung Protect Bundle (LKR 12,000) | EverYoung Grow Bundle (LKR 9,000)" },
    ],
  },
  "TH-PRD-3227": {
    version: OFFICIAL_KB_VERSION,
    tagline:
      "TrueHive Sleep — Ashwagandha Bedtime Support | A Calmer Evening Starts With Clarity (4.6★ | 980+ Reviews)",
    howToUse:
      "SUGGESTED USE: Take 1 serving (1 ml / approx. 30 drops) using the syringe provided 30 minutes before bedtime.\nPREPARATION: Consume directly or stir into a warm glass of almond milk, chamomile tea, or water.\nCYCLE: Follow the serving instructions on the label. Do not exceed the recommended serving.",
    servings: "150 Servings per 100 ml bottle | Serving Size: 1 ml (Approx. 30 Drops)",
    bestTimeToUse: "About 30 minutes before bedtime as part of your evening wind-down routine",
    storage:
      "Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken.",
    ingredients:
      "Built around premium Ashwagandha (Withania somnifera) root extract.\nActive Composition per 1 ml Serving (Approx. 30 Drops): Ashwagandha Root Extract 1000 mg, L-Theanine 100 mg, Chamomile Extract 50 mg, Melatonin 1 mg.",
    mfgDate: "2026-06-19",
    expDate: "2028-06-19",
    shelfLife: "24 Months (Unopened) / 1–3 Months after opening",
    precautions:
      "Consult your doctor or pharmacist before use if you are pregnant, breastfeeding, taking medication or have a medical condition. Ashwagandha may interact with some medicines. Sleep is a wellness supplement, not a sleeping medicine. Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken.",
    pairings:
      "Featured in the EverYoung Protect Bundle (Includes Honey + Protect + Sleep for LKR 12,000 — Save LKR 500) and the EverYoung Grow Bundle (Includes Honey + Grow + Sleep for LKR 9,000 — Save LKR 500).",
    benefits: [
      "Bedtime Ritual: Designed to be taken about 30 minutes before bed for night-time relaxation and restorative sleep support",
      "Wind-Down Support: Helps calm a racing mind and supports relaxation at the end of a busy, stressful day",
      "Ashwagandha Root Extract (1000 mg): Made with Withania somnifera root extract, traditionally used in Ayurveda for relaxation and stress response",
      "Synergistic Calming Blend: Formulated with L-Theanine (100 mg), Chamomile Extract (50 mg), and Melatonin (1 mg) per 1 ml serving",
      "Measured Serving: Each 1 ml serving (~30 drops) is easily measured with the syringe provided",
      "Easy to Take: Take directly or stir into warm almond milk, chamomile herbal tea, or water",
    ],
    reviews: [
      {
        author: "Manuthi Ranasinghe (Yoga Instructor)",
        text: "My sleep quality had deteriorated due to work overload. Sleep has restored my sleep cycles completely. I wake up light, clear-headed, and energized.",
      },
      {
        author: "Christopher De Silva (CEO)",
        text: "Staring at screens all day leaves my mind racing at night. A serving before bed calms the chatter and allows me to sleep like a child.",
      },
      {
        author: "Anjali Fernando (School Teacher)",
        text: "After a long day of teaching, it helps me unwind. I've noticed I'm sleeping more peacefully and waking up feeling refreshed.",
      },
      {
        author: "Ruwan De Mel (Restaurant Owner)",
        text: "Running a restaurant is stressful. It helps me slow down at the end of the day and enjoy a better night's rest.",
      },
      {
        author: "Emily Carter (Yoga Instructor)",
        text: "Complements my evening yoga practice perfectly. I feel calmer before bedtime and wake up feeling refreshed.",
      },
      {
        author: "Harshini Ekanayake (Pharmacist)",
        text: "Has become my favorite evening ritual. It helps me switch off after busy days at the pharmacy.",
      },
    ],
    otherDetails:
      "THE SCIENCE OF SLEEP: Built around ashwagandha (Withania somnifera), a botanical traditionally used in Ayurveda and studied for its role in relaxation and the body's response to stress. Unlike general ashwagandha products, TrueHive Sleep is specifically formulated as a bedtime wind-down supplement.\nDELIVERY & GUARANTEE: Nationwide Free Delivery (1–3 business days), Cash on Delivery, 1-Month 100% Money-Back Guarantee.",
    customSpecs: [
      { label: "Official Product Name", value: "TrueHive Sleep (The Core 4 — Rest & Routine)" },
      { label: "Volume & Servings", value: "100 ml Bottle | 150 Servings (1 ml / ~30 drops per serving)" },
      { label: "Active Ingredients (per 1 ml)", value: "Ashwagandha Root 1000 mg | L-Theanine 100 mg | Chamomile 50 mg | Melatonin 1 mg" },
      { label: "Key Botanical", value: "Withania somnifera (Ashwagandha Root Extract)" },
      { label: "Customer Rating", value: "4.6 / 5.0 Stars (980+ Customer Reviews)" },
      { label: "Bundle Offers", value: "EverYoung Protect Bundle (LKR 12,000) | EverYoung Grow Bundle (LKR 9,000)" },
      { label: "Delivery & Guarantee", value: "Nationwide Free Delivery (1–3 Days) | 1-Month 100% Money-Back Guarantee" },
    ],
  },
  "TH-PRD-5786": {
    version: OFFICIAL_KB_VERSION,
    tagline:
      "EverYoung Grow — Castor & Black Seed Hair, Scalp and Beard Oil | A Considered Scalp-Care Routine (4.5★ | 820+ Reviews)",
    howToUse:
      "SUGGESTED USE: Apply 2–3 droppers directly to the scalp, hair, or beard. Massage gently for 2–3 minutes. Use 2–4 times per week.\nLEAVE IN: Leave the oil in for at least 45–60 minutes, or leave overnight for deep nutrient absorption.\nWASH OUT: Wash thoroughly using a mild natural shampoo.",
    servings:
      "150 Applications per 100 ml bottle | 2–3 droppers per application (Use 2–4 times per week)",
    bestTimeToUse:
      "Leave in for at least 45–60 minutes before washing, or leave overnight before bedtime (2–4 times per week)",
    storage:
      "Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken.",
    ingredients:
      "Active Botanical Oils:\n1. Cold-Pressed Castor Oil (Pure Ricinus communis oil, cold-pressed to retain natural ricinoleic acid)\n2. Pure Cold-Pressed Black Seed Oil (Pressed from Nigella sativa seeds, offering natural fatty acids for hair and scalp conditioning)\n3. Virgin Coconut Oil (Active conditioning & moisture retention)",
    mfgDate: "2026-06-19",
    expDate: "2028-06-19",
    shelfLife: "24 Months (Unopened) / 1–3 Months after opening",
    precautions:
      "For external use only. Patch test before first use and stop if irritation occurs. Avoid contact with eyes. Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken. Results vary from person to person, and no cosmetic oil can guarantee hair growth.",
    pairings:
      "Featured in the EverYoung Grow Bundle (Includes Honey + Grow + Sleep for LKR 9,000 — Save LKR 500 off LKR 9,500). Can also be paired with daily internal use of TrueHive Protect.",
    benefits: [
      "Scalp Massage & Root Care: Designed to be massaged into the scalp as part of a regular routine to nourish roots and support hair density",
      "Cold-Pressed Castor Oil Base: Rich in natural ricinoleic acid combined with Black Seed Oil and Virgin Coconut Oil",
      "Hair Conditioning & Natural Shine: Helps dry, dull, or rough-feeling hair feel softer, shinier, and more manageable",
      "Dry Scalp Comfort: Moisturises dry-feeling skin on the scalp and helps reduce dandruff and flakiness",
      "Hair & Beard Care in One: Formulated to nourish and condition both scalp hair and facial beard hair and the skin underneath",
      "Suitable for Men & Women: Can be used by adults of any gender as part of a regular hair and grooming routine",
    ],
    reviews: [
      {
        author: "Dilini Perera (Hairstylist)",
        text: "Many of my clients struggled with thinning hair. After recommending GROW, I've seen visible improvements in root strength and overall density in just 3 weeks.",
      },
      {
        author: "Sandun Randeni (Manager Finance)",
        text: "Helped reduce my dandruff and dry scalp significantly. It has a rich texture, so leaving it on overnight and washing it off works best.",
      },
      {
        author: "Kasun Jayawardena (Software Engineer)",
        text: "I've been using Grow consistently for two months. My hair feels healthier and stronger, and I've noticed less hair fall during washing.",
      },
      {
        author: "Chamari Gunasekara (University Lecturer)",
        text: "After several weeks of using Grow, my hair looks healthier and shinier. I'm happy with the results so far.",
      },
      {
        author: "Nadeesha Karunaratne (Dentist)",
        text: "I was looking for a natural hair care solution, and Grow has been a great addition to my self-care routine.",
      },
      {
        author: "Sophia Bennett (Graphic Designer)",
        text: "Grow has made my hair feel softer and healthier. I love that it's made with natural ingredients.",
      },
    ],
    otherDetails:
      "THE SCIENCE OF GROW: Combines cold-pressed castor oil (Ricinus communis), rich in ricinoleic acid, with cold-pressed black seed oil (Nigella sativa) and virgin coconut oil. Massaged into the scalp or beard, the blend conditions hair and reduces dryness.\nDELIVERY & GUARANTEE: Nationwide Free Delivery (1–3 business days), Cash on Delivery, 1-Month 100% Money-Back Guarantee.",
    customSpecs: [
      { label: "Official Product Name", value: "EverYoung Grow (The Core 4 — Scalp, Hair & Beard)" },
      { label: "Volume & Applications", value: "100 ml Bottle | 150 Applications (2–3 droppers per use)" },
      { label: "Active Ingredients", value: "Cold-Pressed Castor Oil + Cold-Pressed Black Seed Oil + Virgin Coconut Oil" },
      { label: "Key Fatty Acid", value: "Ricinoleic Acid & Nigella Sativa Essential Fatty Acids" },
      { label: "Application Areas", value: "Scalp, Hair & Beard Care (Suitable for Adult Men & Women)" },
      { label: "Customer Rating", value: "4.5 / 5.0 Stars (820+ Customer Reviews)" },
      { label: "Recommended Bundle", value: "EverYoung Grow Bundle (Honey + Grow + Sleep) — LKR 9,000 (Save LKR 500)" },
      { label: "Delivery & Guarantee", value: "Nationwide Free Delivery (1–3 Days) | 1-Month 100% Money-Back Guarantee" },
    ],
  },
};

export function ProductKnowledgeModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductKnowledgeModalProps) {
  const [activeTab, setActiveTab] = useState<
    "USAGE" | "INGREDIENTS" | "BENEFITS" | "REVIEWS" | "OTHERS"
  >("USAGE");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Knowledge base state fields
  const [tagline, setTagline] = useState("");
  const [howToUse, setHowToUse] = useState("");
  const [servings, setServings] = useState("");
  const [bestTimeToUse, setBestTimeToUse] = useState("");
  const [storage, setStorage] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expDate, setExpDate] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [pairings, setPairings] = useState("");
  const [precautions, setPrecautions] = useState("");
  const [benefitsList, setBenefitsList] = useState<string[]>([]);
  const [reviewsList, setReviewsList] = useState<Array<{ author: string; text: string }>>([]);
  const [otherDetails, setOtherDetails] = useState("");
  const [customSpecs, setCustomSpecs] = useState<Array<{ label: string; value: string }>>([]);

  // Populate data when product opens
  useEffect(() => {
    if (product) {
      let cachedKb: any = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`truehive_kb_${product.sku || product.id}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.version === OFFICIAL_KB_VERSION) {
              cachedKb = parsed;
            }
          }
        } catch {}
      }

      const defaultPreset = DEFAULT_ENGLISH_KB_BY_SKU[product.sku] || {};
      const dbKb =
        product.knowledgeBase?.version === OFFICIAL_KB_VERSION ? product.knowledgeBase : null;
      const rawKb = cachedKb || dbKb || defaultPreset;

      setTagline(rawKb.tagline || defaultPreset.tagline || "");
      setHowToUse(rawKb.howToUse || defaultPreset.howToUse || "");
      setServings(rawKb.servings || defaultPreset.servings || "");
      setBestTimeToUse(rawKb.bestTimeToUse || defaultPreset.bestTimeToUse || "");
      setStorage(rawKb.storage || defaultPreset.storage || "");
      setIngredients(rawKb.ingredients || defaultPreset.ingredients || "");
      setMfgDate(rawKb.mfgDate || defaultPreset.mfgDate || "");
      setExpDate(rawKb.expDate || defaultPreset.expDate || "");
      setShelfLife(rawKb.shelfLife || defaultPreset.shelfLife || "");
      setPairings(rawKb.pairings || defaultPreset.pairings || "");
      setPrecautions(rawKb.precautions || defaultPreset.precautions || "");
      setOtherDetails(rawKb.otherDetails || defaultPreset.otherDetails || "");

      if (Array.isArray(rawKb.benefits) && rawKb.benefits.length > 0) {
        setBenefitsList(rawKb.benefits);
      } else if (Array.isArray(defaultPreset.benefits) && defaultPreset.benefits.length > 0) {
        setBenefitsList(defaultPreset.benefits);
      } else {
        setBenefitsList([
          "100% pure & natural organic formulation",
          "Clinically backed wellness and vitality support",
        ]);
      }

      if (Array.isArray(rawKb.reviews) && rawKb.reviews.length > 0) {
        setReviewsList(rawKb.reviews);
      } else if (Array.isArray(defaultPreset.reviews) && defaultPreset.reviews.length > 0) {
        setReviewsList(defaultPreset.reviews);
      } else {
        setReviewsList([
          { author: "Verified Customer", text: "Excellent quality and fast results!" },
        ]);
      }

      if (Array.isArray(rawKb.customSpecs) && rawKb.customSpecs.length > 0) {
        setCustomSpecs(rawKb.customSpecs);
      } else if (Array.isArray(defaultPreset.customSpecs) && defaultPreset.customSpecs.length > 0) {
        setCustomSpecs(defaultPreset.customSpecs);
      } else {
        setCustomSpecs([{ label: "", value: "" }]);
      }

      setSuccessMsg("");
      setErrorMsg("");
      setActiveTab("USAGE");
    }
  }, [product]);

  if (!product) return null;

  // Handlers for dynamic lists
  const handleAddBenefit = () => {
    setBenefitsList([...benefitsList, ""]);
  };

  const handleUpdateBenefit = (index: number, val: string) => {
    const next = [...benefitsList];
    next[index] = val;
    setBenefitsList(next);
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  const handleAddReview = () => {
    setReviewsList([...reviewsList, { author: "", text: "" }]);
  };

  const handleUpdateReview = (index: number, field: "author" | "text", val: string) => {
    const next = [...reviewsList];
    next[index] = { ...next[index], [field]: val };
    setReviewsList(next);
  };

  const handleRemoveReview = (index: number) => {
    setReviewsList(reviewsList.filter((_, i) => i !== index));
  };

  const handleAddCustomSpec = () => {
    setCustomSpecs([...customSpecs, { label: "", value: "" }]);
  };

  const handleUpdateCustomSpec = (index: number, field: "label" | "value", val: string) => {
    const next = [...customSpecs];
    next[index] = { ...next[index], [field]: val };
    setCustomSpecs(next);
  };

  const handleRemoveCustomSpec = (index: number) => {
    setCustomSpecs(customSpecs.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    const updatedKb = {
      version: OFFICIAL_KB_VERSION,
      productName: product.name,
      tagline: tagline.trim(),
      howToUse: howToUse.trim(),
      servings: servings.trim(),
      bestTimeToUse: bestTimeToUse.trim(),
      storage: storage.trim(),
      ingredients: ingredients.trim(),
      mfgDate: mfgDate.trim(),
      expDate: expDate.trim(),
      shelfLife: shelfLife.trim(),
      pairings: pairings.trim(),
      precautions: precautions.trim(),
      otherDetails: otherDetails.trim(),
      benefits: benefitsList.map((b) => b.trim()).filter(Boolean),
      reviews: reviewsList.filter((r) => r.text.trim() || r.author.trim()),
      customSpecs: customSpecs.filter((s) => s.label.trim() || s.value.trim()),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `truehive_kb_${product.sku || product.id}`,
            JSON.stringify(updatedKb)
          );
        } catch {}
      }

      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          knowledgeBase: updatedKb,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save Knowledge Base.");
      }

      product.knowledgeBase = updatedKb;

      setSuccessMsg(
        "Knowledge Base saved! WhatsApp AI Bot will now use these updated product details."
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Knowledge Base & AI Details"
      description="Manage clinical facts, usage routines, servings, expiry dates, reviews, and additional specs used by the WhatsApp AI chatbot."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Product Context Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">{product.name}</span>
              <Badge variant="primary" className="text-[10px]">
                {product.sku}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Price:{" "}
              <span className="text-emerald-400 font-semibold">
                Rs. {product.sellingPrice.toLocaleString()}
              </span>{" "}
              | Current Stock:{" "}
              <span className="text-white font-semibold">
                {product.currentStock} {product.unit}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded-full text-[11px] font-bold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp AI Bot Active
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("USAGE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "USAGE"
                ? "bg-slate-800 text-emerald-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Usage & Routine
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INGREDIENTS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "INGREDIENTS"
                ? "bg-slate-800 text-indigo-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Ingredients & Expiry
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("BENEFITS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "BENEFITS"
                ? "bg-slate-800 text-amber-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Benefits & Pairings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REVIEWS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "REVIEWS"
                ? "bg-slate-800 text-purple-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Customer Reviews
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("OTHERS")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "OTHERS"
                ? "bg-slate-800 text-cyan-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Others
          </button>
        </div>

        {/* TAB 1: USAGE & ROUTINES */}
        {activeTab === "USAGE" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                How to Consume / Use
              </label>
              <textarea
                rows={4}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="e.g. Take 1 serving (1 ml) using the syringe provided, preferably on an empty stomach in the morning."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Servings & Dosage
                </label>
                <input
                  type="text"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="e.g. 150 Servings per 100 ml bottle | Serving Size: 1 ml (Approx. 30 Drops)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Best Time to Use
                </label>
                <input
                  type="text"
                  value={bestTimeToUse}
                  onChange={(e) => setBestTimeToUse(e.target.value)}
                  placeholder="e.g. Morning on an empty stomach or 30 minutes before bedtime"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Storage Instructions
              </label>
              <input
                type="text"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="e.g. Store in a cool, dry place. Keep out of reach of children. Do not use if seal is broken."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: INGREDIENTS & MANUFACTURING */}
        {activeTab === "INGREDIENTS" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Active Natural Ingredients
              </label>
              <textarea
                rows={3}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. 100% pure cold-pressed Nigella sativa (Black Seed) oil, extracted without heat or chemical solvents."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Manufacture Date
                </label>
                <input
                  type="date"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Shelf Life
                </label>
                <input
                  type="text"
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value)}
                  placeholder="e.g. 24 Months (Unopened) / 1–3 Months after opening"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Precautions / Warnings
              </label>
              <textarea
                rows={2}
                value={precautions}
                onChange={(e) => setPrecautions(e.target.value)}
                placeholder="e.g. Consult your doctor or pharmacist before use if you are pregnant, breastfeeding, taking medication or have a medical condition."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* TAB 3: BENEFITS & PAIRINGS */}
        {activeTab === "BENEFITS" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Headline Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. EverYoung Protect — Cold-Pressed Black Seed Oil | Daily Support"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">
                  Key Benefits & Clinical Advantages
                </label>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Benefit
                </button>
              </div>

              <div className="space-y-2">
                {benefitsList.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleUpdateBenefit(idx, e.target.value)}
                      placeholder="e.g. Cold-pressed without heat or chemical solvents"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    {benefitsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Recommended Pairings & Bundle Offers
              </label>
              <input
                type="text"
                value={pairings}
                onChange={(e) => setPairings(e.target.value)}
                placeholder="e.g. Mix with a spoonful of TrueHive Honey. Available in EverYoung Protect Bundle (LKR 12,000)."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS & SOCIAL PROOF */}
        {activeTab === "REVIEWS" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Customer Testimonials & Social Proof
                </h4>
                <p className="text-[11px] text-slate-400">
                  The WhatsApp bot cites these verified reviews when answering customer inquiries.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddReview}
                className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Review
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {reviewsList.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={rev.author}
                      onChange={(e) => handleUpdateReview(idx, "author", e.target.value)}
                      placeholder="Customer Name / Role (e.g. Marcus Fernando - Fitness Instructor)"
                      className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveReview(idx)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={rev.text}
                    onChange={(e) => handleUpdateReview(idx, "text", e.target.value)}
                    placeholder="Customer quote or testimonial..."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: OTHERS (Additional Product Details & Custom Specs) */}
        {activeTab === "OTHERS" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    Custom Specifications & Extra Attributes
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Add extra product attributes (e.g. Origin, Servings, Lab Report Reference, Bundle Offer).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomSpec}
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Extra Field
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {customSpecs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => handleUpdateCustomSpec(idx, "label", e.target.value)}
                      placeholder="Field Name (e.g. Lab Report Reference)"
                      className="w-1/3 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-semibold"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateCustomSpec(idx, "value", e.target.value)}
                      placeholder="Value / Detail (e.g. ARL/TR/26/042)"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    {customSpecs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSpec(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition"
                        title="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Additional Notes & Other Product Information
              </label>
              <textarea
                rows={4}
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                placeholder="Enter any other details, special instructions, FAQs, scientific background, or delivery notes for the AI chatbot..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-lg shadow-emerald-950/40"
            rightIcon={<Sparkles className="w-4 h-4" />}
          >
            Save Knowledge Base
          </Button>
        </div>
      </form>
    </Modal>
  );
}
