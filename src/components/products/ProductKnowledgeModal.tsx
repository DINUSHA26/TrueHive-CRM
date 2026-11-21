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

const DEFAULT_ENGLISH_KB_BY_SKU: Record<string, any> = {
  "TH-PRD-6068": {
    tagline: "Cold-Pressed Black Seed Oil (Nigella Sativa) | Daily Immune & Cellular Support",
    howToUse:
      "Take a few drops directly under the tongue or mix with warm water before morning or evening meals. For best results and smoother taste, mix with 1 teaspoon of TrueHive Pure Ceylon Honey.",
    servings: "2.5 ml - 5 ml (1/2 to 1 teaspoon), once or twice daily",
    bestTimeToUse: "Morning on an empty stomach or 30 minutes before bedtime",
    storage: "Store in a cool, dry place away from direct sunlight.",
    ingredients:
      "100% Pure Virgin Cold-Pressed Nigella Sativa (Black Seed Oil) - Unrefined, no heat, no chemicals, solvent-free.",
    mfgDate: "2026-01-15",
    expDate: "2028-01-15",
    shelfLife: "24 Months (2 Years)",
    precautions:
      "Consult a physician before use if pregnant or nursing. Keep out of reach of children.",
    pairings:
      "Pairs best with TrueHive Pure Ceylon Honey (100ml) — combining them boosts nutrient absorption by 3x and balances the natural earthy taste.",
    benefits: [
      "Boosts natural immune system and daily cellular defense",
      "Rich in active Thymoquinone to reduce internal inflammation and oxidative stress",
      "Supports healthy blood sugar and cholesterol levels naturally",
      "Relieves respiratory issues, seasonal allergies, sinus, and asthma symptoms",
      "Promotes healthy skin clarity and hair vitality",
    ],
    reviews: [
      {
        author: "Dr. K. Silva",
        text: "Best quality pure cold-pressed black seed oil in Sri Lanka. Lab tested with high thymoquinone potency.",
      },
      {
        author: "Saman Perera (Colombo)",
        text: "After 14 days of daily use, my recurring sinus allergies and morning congestion completely cleared up.",
      },
      {
        author: "Ayesha N.",
        text: "Taking it with TrueHive honey every morning. Feeling super energetic and active throughout the day!",
      },
    ],
    otherDetails:
      "First-press extraction at low temperatures (<35°C) to preserve volatile oils and active Thymoquinone. Suitable for daily preventive wellness.",
    customSpecs: [
      { label: "Extraction Method", value: "100% Virgin Cold-Pressed" },
      { label: "Active Compound", value: "High Thymoquinone (TQ)" },
      { label: "Volume", value: "100 ml Amber Glass Bottle" },
    ],
  },
  "TH-PRD-3628": {
    tagline: "100% Pure Unpasteurised Ceylon Bee Honey | Raw Natural Energy",
    howToUse:
      "Consume 1 teaspoon directly, stir into lukewarm water or herbal tea, or drizzle over breakfast. Combine with TrueHive Protect Black Seed Oil in the morning for maximum immunity.",
    servings: "1 - 2 teaspoons (5 ml - 10 ml) daily",
    bestTimeToUse: "First thing in the morning on an empty stomach, pre-workout, or before bedtime",
    storage: "Store at room temperature in a dry place. Do not refrigerate.",
    ingredients:
      "100% Pure Raw Ceylon Multi-Floral Bee Honey - Zero added sugar, no corn syrup, no artificial preservatives.",
    mfgDate: "2026-02-01",
    expDate: "2029-02-01",
    shelfLife: "36 Months (Pure honey naturally preserves indefinitely when sealed)",
    precautions:
      "Not recommended for infants under 12 months of age. Never mix with boiling hot water as high heat destroys live enzymes.",
    pairings:
      "Highly recommended to pair with TrueHive Protect (Black Seed Oil) or TrueHive Sleeep elixir.",
    benefits: [
      "100% pure, raw, unpasteurised Sri Lankan wild floral bee honey",
      "Retains all natural live enzymes, bee pollen, vitamins, and antioxidants",
      "Healthy, natural alternative to refined white sugar",
      "Soothes sore throats, coughs, and supports smooth digestion and gut health",
      "Provides instant natural energy boost for workouts and busy lifestyles",
    ],
    reviews: [
      {
        author: "Nimani F.",
        text: "Smooth floral aroma and authentic taste. Passed every purity test at home!",
      },
      {
        author: "Roshan M.",
        text: "I combine 1 teaspoon with Protect oil every morning. Best daily ritual for stamina.",
      },
    ],
    otherDetails:
      "Ethically harvested from pristine forest apiaries in Sri Lanka. Coarse-filtered only to keep natural pollen intact.",
    customSpecs: [
      { label: "Origin", value: "100% Ceylon Forest Apiaries" },
      { label: "Processing", value: "Raw & Never Pasteurised" },
      { label: "Lab Tested", value: "Certified No Added Sugar" },
    ],
  },
  "TH-PRD-3227": {
    tagline: "Deep Restorative Sleep & Stress Relief Botanical Formula",
    howToUse:
      "Take 5-10 drops directly under the tongue or mix into a small cup of warm water or herbal tea 30 minutes before going to bed.",
    servings: "2.5 ml - 5 ml (10-15 drops) once daily at night",
    bestTimeToUse: "30 minutes before bedtime in a calm, dim environment",
    storage: "Store in a cool, dark cabinet away from heat and moisture.",
    ingredients:
      "Ashwagandha Root Extract, Roman Chamomile, Pure Lavender Botanicals, Raw Ceylon Bee Honey Base.",
    mfgDate: "2026-01-10",
    expDate: "2028-01-10",
    shelfLife: "24 Months",
    precautions:
      "Do not drive or operate heavy machinery after taking. Avoid combining with alcohol or sedative medications.",
    pairings:
      "Pair with 1 teaspoon of TrueHive Pure Honey in warm chamomile water before bed for deeper relaxation.",
    benefits: [
      "Calms an overactive mind and naturally relieves insomnia and restlessness",
      "Promotes 7-8 hours of uninterrupted, deep restorative REM sleep",
      "Wake up refreshed and energized with zero morning grogginess or habit dependency",
      "Reduces evening cortisol, mental stress, anxiety, and physical fatigue",
    ],
    reviews: [
      {
        author: "Chathurika D.",
        text: "Suffered from work-related insomnia for months. Now I fall asleep peacefully within 15 minutes!",
      },
      {
        author: "Kavinda P.",
        text: "100% natural herbs with no dependency. I wake up fresh at 6 AM every day.",
      },
    ],
    otherDetails:
      "Non-habit forming botanical synergy designed for high-stress professionals and light sleepers.",
    customSpecs: [
      { label: "Formula Type", value: "100% Herbal & Melatonin-Free" },
      { label: "Key Adaptogen", value: "Organic Ashwagandha & Chamomile" },
      { label: "Habit Forming", value: "No (100% Non-Addictive)" },
    ],
  },
  "TH-PRD-5786": {
    tagline: "Botanical Hair Growth & Scalp Follicle Vitality Elixir",
    howToUse:
      "Apply a few drops directly onto the scalp and hair roots 3-4 times a week. Gently massage with fingertips for 5 minutes. Leave on for at least 1-2 hours (or overnight) before washing with a mild shampoo.",
    servings: "3 ml - 5 ml per scalp application (3 to 4 times per week)",
    bestTimeToUse: "1-2 hours before bath or overnight before bedtime",
    storage: "Keep tightly closed at room temperature away from direct sunlight.",
    ingredients:
      "Pure Rosemary Essential Oil, Cold-Pressed Castor Oil, Black Seed (Nigella Sativa) Extract, Virgin King Coconut Oil, Natural Vitamin E.",
    mfgDate: "2026-01-20",
    expDate: "2028-01-20",
    shelfLife: "24 Months",
    precautions:
      "For external scalp and hair use only. Avoid contact with eyes. Perform a small patch test if you have a sensitive scalp.",
    pairings:
      "Combine external use of TrueHive Grow with daily internal intake of TrueHive Protect for complete inside-out hair follicle nutrition.",
    benefits: [
      "Reduces hair fall and stimulates dormant hair follicles for new hair regrowth",
      "Strengthens hair roots and increases overall hair thickness, volume, and shine",
      "Deeply nourishes dry scalp and eliminates dandruff and itchiness",
      "Helps prevent premature greying and split ends naturally",
    ],
    reviews: [
      {
        author: "Dinithi P.",
        text: "Noticeable baby hair growth along my hairline within 3 weeks of regular use!",
      },
      {
        author: "Mahesh B.",
        text: "Dandruff is completely gone and hair thickness improved significantly. Highly recommended.",
      },
    ],
    otherDetails:
      "Lightweight, non-sticky botanical oil blend formulated for both men and women experiencing hair thinning.",
    customSpecs: [
      { label: "Application Type", value: "External Scalp & Hair Oil" },
      { label: "Key Actives", value: "Rosemary, Black Seed & Castor Oil" },
      { label: "Paraben & Sulfate", value: "100% Free (No Mineral Oil)" },
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

  // Helper to strip Sinhala characters if old cached data had Sinhala
  const hasSinhala = (str?: string) => Boolean(str && /[\u0D80-\u0DFF]/.test(str));

  // Populate data when product opens
  useEffect(() => {
    if (product) {
      let cachedKb: any = null;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`truehive_kb_${product.sku || product.id}`);
          if (raw) cachedKb = JSON.parse(raw);
        } catch {}
      }

      const defaultPreset = DEFAULT_ENGLISH_KB_BY_SKU[product.sku] || {};
      const rawKb = cachedKb || product.knowledgeBase || {};

      // Use rawKb if present and in English, otherwise fallback to clean English preset
      const pickText = (val: string | undefined, fallback: string | undefined) => {
        if (val && !hasSinhala(val)) return val;
        return fallback || "";
      };

      setTagline(pickText(rawKb.tagline, defaultPreset.tagline));
      setHowToUse(pickText(rawKb.howToUse, defaultPreset.howToUse));
      setServings(pickText(rawKb.servings, defaultPreset.servings));
      setBestTimeToUse(pickText(rawKb.bestTimeToUse, defaultPreset.bestTimeToUse));
      setStorage(pickText(rawKb.storage, defaultPreset.storage));
      setIngredients(pickText(rawKb.ingredients, defaultPreset.ingredients));
      setMfgDate(rawKb.mfgDate || defaultPreset.mfgDate || "");
      setExpDate(rawKb.expDate || defaultPreset.expDate || "");
      setShelfLife(pickText(rawKb.shelfLife, defaultPreset.shelfLife));
      setPairings(pickText(rawKb.pairings, defaultPreset.pairings));
      setPrecautions(pickText(rawKb.precautions, defaultPreset.precautions));
      setOtherDetails(pickText(rawKb.otherDetails, defaultPreset.otherDetails));

      const rawBenefits = Array.isArray(rawKb.benefits) ? rawKb.benefits : [];
      const englishBenefits = rawBenefits.filter((b: string) => b && !hasSinhala(b));
      if (englishBenefits.length > 0) {
        setBenefitsList(englishBenefits);
      } else if (Array.isArray(defaultPreset.benefits) && defaultPreset.benefits.length > 0) {
        setBenefitsList(defaultPreset.benefits);
      } else {
        setBenefitsList([
          "100% pure & natural organic formulation",
          "Clinically backed wellness and vitality support",
        ]);
      }

      const rawReviews = Array.isArray(rawKb.reviews) ? rawKb.reviews : [];
      const englishReviews = rawReviews.filter(
        (r: any) => r && !hasSinhala(r.text) && !hasSinhala(r.author)
      );
      if (englishReviews.length > 0) {
        setReviewsList(englishReviews);
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
      // Cache locally for immediate UI persistence
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

        {/* Tab Navigation (Clean wrap without horizontal scrollbar) */}
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
                rows={3}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="e.g. Take a few drops directly under the tongue or mix with warm water or pure bee honey before meals."
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
                  placeholder="e.g. 2.5 ml - 5 ml (1/2 to 1 teaspoon) once or twice daily"
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
                placeholder="e.g. Store in a cool, dry place at room temperature away from direct sunlight."
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
                placeholder="e.g. 100% Pure Virgin Cold-Pressed Nigella Sativa (Black Seed Oil) - High Thymoquinone content, solvent-free."
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
                  placeholder="e.g. 24 Months (2 Years)"
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
                placeholder="e.g. Consult a doctor before use if pregnant or nursing. Keep out of reach of children."
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
                placeholder="e.g. Cold-Pressed Black Seed Oil | Daily Immune & Cellular Support"
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
                      placeholder="e.g. Strengthens natural immunity and protects against seasonal allergies"
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
                Recommended Pairings & Combo Upsell
              </label>
              <input
                type="text"
                value={pairings}
                onChange={(e) => setPairings(e.target.value)}
                placeholder="e.g. Pair with TrueHive Pure Ceylon Honey to boost nutrient absorption by 3x."
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
                  The WhatsApp bot cites these genuine reviews when answering customer inquiries.
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

            <div className="space-y-3">
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
                      placeholder="Customer Name / Location (e.g. Saman Perera - Colombo)"
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
                    placeholder="Customer quote or testimonial (e.g. After 14 days of daily use, my sinus allergies completely cleared up)..."
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
                    Add any extra product attributes (e.g. Origin, Volume, Extraction Method, Lab Certification).
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

              <div className="space-y-2">
                {customSpecs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => handleUpdateCustomSpec(idx, "label", e.target.value)}
                      placeholder="Field Name (e.g. Extraction Method)"
                      className="w-1/3 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-semibold"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateCustomSpec(idx, "value", e.target.value)}
                      placeholder="Value / Detail (e.g. 100% Virgin Cold-Pressed)"
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
