"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Zap,
} from "lucide-react";
import type { ProductItem } from "@/lib/store";

interface ProductKnowledgeModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductKnowledgeModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: ProductKnowledgeModalProps) {
  const [activeTab, setActiveTab] = useState<"USAGE" | "INGREDIENTS" | "BENEFITS" | "REVIEWS">("USAGE");
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

  // Populate data when product opens
  useEffect(() => {
    if (product) {
      const kb = product.knowledgeBase || {};
      setTagline(kb.tagline || "");
      setHowToUse(kb.howToUse || "");
      setServings(kb.servings || "");
      setBestTimeToUse(kb.bestTimeToUse || "");
      setStorage(kb.storage || "");
      setIngredients(kb.ingredients || "");
      setMfgDate(kb.mfgDate || "");
      setExpDate(kb.expDate || "");
      setShelfLife(kb.shelfLife || "");
      setPairings(kb.pairings || "");
      setPrecautions(kb.precautions || "");

      if (Array.isArray(kb.benefits) && kb.benefits.length > 0) {
        setBenefitsList(kb.benefits);
      } else {
        setBenefitsList([
          "100% pure & natural organic formulation",
          "Clinically backed wellness and vitality support",
        ]);
      }

      if (Array.isArray(kb.reviews) && kb.reviews.length > 0) {
        setReviewsList(kb.reviews);
      } else {
        setReviewsList([
          { author: "Verified Customer", text: "Excellent quality and fast results!" },
        ]);
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
      benefits: benefitsList.map((b) => b.trim()).filter(Boolean),
      reviews: reviewsList.filter((r) => r.text.trim() || r.author.trim()),
      updatedAt: new Date().toISOString(),
    };

    try {
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

      // Update product object locally
      product.knowledgeBase = updatedKb;

      setSuccessMsg("Knowledge Base saved successfully! Gemini AI WhatsApp bot will now use this updated information.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
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
      title={`Product Knowledge Base & AI Details`}
      description={`Manage clinical facts, usage routines, servings, expiry dates, and reviews used by WhatsApp AI chatbot.`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              Price: <span className="text-emerald-400 font-semibold">Rs. {product.sellingPrice.toLocaleString()}</span> | Current Stock:{" "}
              <span className="text-white font-semibold">{product.currentStock} {product.unit}</span>
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
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("USAGE")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === "USAGE"
                ? "bg-slate-800 text-emerald-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Usage & Routine
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INGREDIENTS")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === "INGREDIENTS"
                ? "bg-slate-800 text-indigo-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Ingredients & Expiry
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("BENEFITS")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === "BENEFITS"
                ? "bg-slate-800 text-amber-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Benefits & Pairings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("REVIEWS")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === "REVIEWS"
                ? "bg-slate-800 text-purple-400 border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-850"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reviews & Social Proof
          </button>
        </div>

        {/* TAB 1: USAGE & ROUTINES */}
        {activeTab === "USAGE" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                How to Consume / Use (භාවිතා කරන ආකාරය)
              </label>
              <textarea
                rows={3}
                value={howToUse}
                onChange={(e) => setHowToUse(e.target.value)}
                placeholder="e.g. උදෑසන හෝ රාත්‍රී ආහාරයට පෙර බින්දු කිහිපයක් දිව යටට හෝ මද උණුසුම් වතුරට/මී පැණි සමඟ මිශ්‍ර කර පානය කරන්න."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Servings & Dosage (දෛනික මාත්‍රාව)
                </label>
                <input
                  type="text"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="e.g. 2.5 ml - 5 ml (තේ හැඳි 1/2 සිට 1 දක්වා) දිනකට 1-2 වරක්"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Best Time to Use (භාවිතා කිරීමට සුදුසුම වේලාව)
                </label>
                <input
                  type="text"
                  value={bestTimeToUse}
                  onChange={(e) => setBestTimeToUse(e.target.value)}
                  placeholder="e.g. උදෑසන හිස්බඩ (Empty stomach in morning) හෝ නින්දට පෙර"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Storage Instructions (ගබඩා කිරීම)
              </label>
              <input
                type="text"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="e.g. හිරු එළිය නොවැටෙන සිසිල් වියළි ස්ථානයක අසුරා තබන්න. කාමර උෂ්ණත්වයේ තබන්න."
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
                Active Natural Ingredients (අඩංගු ස්වභාවික සංඝටක)
              </label>
              <textarea
                rows={3}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="e.g. 100% Pure Virgin Cold-Pressed Nigella Sativa (කළුදුරු තෙල්) - High Thymoquinone content, solvent-free."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Manufacture Date (නිෂ්පාදිත දිනය)
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
                  Expiry Date (කල් ඉකුත්වීමේ දිනය)
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
                  Shelf Life (කල් තබා ගත හැකි කාලය)
                </label>
                <input
                  type="text"
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value)}
                  placeholder="e.g. මාස 24 (2 Years)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Precautions / Warnings (ආරක්ෂිත උපදෙස් / අසාත්මිකතා)
              </label>
              <textarea
                rows={2}
                value={precautions}
                onChange={(e) => setPrecautions(e.target.value)}
                placeholder="e.g. ගර්භනී සමයේ භාවිතයට පෙර වෛද්‍ය උපදෙස් ලබාගන්න. ළමයින්ගෙන් ඈත් කර තබන්න."
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
                Headline Tagline (ප්‍රධාන ආකර්ශනීය වාක්‍යය)
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
                  Key Benefits & Clinical Advantages (ප්‍රතිලාභ ලැයිස්තුව)
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
                      placeholder="e.g. ස්වභාවික ප්‍රතිශක්තිකරණය උපරිමයෙන් ශක්තිමත් කරයි"
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
                Recommended Pairings & Combo Upsell (සංයෝජනය කළ හැකි වෙනත් නිෂ්පාදන)
              </label>
              <input
                type="text"
                value={pairings}
                onChange={(e) => setPairings(e.target.value)}
                placeholder="e.g. TrueHive Pure Ceylon Honey සමඟ යුගලයක් ලෙස ගැනීමෙන් ශරීරයට උරාගැනීම 3 ගුණයකින් වැඩි වේ."
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
                <h4 className="text-xs font-bold text-slate-200">Customer Testimonials & Social Proof</h4>
                <p className="text-[11px] text-slate-400">The WhatsApp bot cites these genuine reviews when answering customer doubts.</p>
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
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={rev.author}
                      onChange={(e) => handleUpdateReview(idx, "author", e.target.value)}
                      placeholder="Customer Name / Location (e.g. සමන් පෙරේරා - Colombo)"
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
                    placeholder="Customer quote or testimonial (e.g. දින 14ක් බිව්වට පස්සේ සෙම්ප්‍රතිශ්‍යාව සහ ඇලර්ජි නැවතුණා)..."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
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
