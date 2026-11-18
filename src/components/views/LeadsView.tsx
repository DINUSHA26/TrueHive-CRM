"use client";

import React, { useState } from "react";
import {
  UserPlus,
  CalendarPlus,
  PhoneCall,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LeadItem } from "@/lib/store";

interface LeadsViewProps {
  leads: LeadItem[];
  onRefresh: () => void;
}

export function LeadsView({ leads, onRefresh }: LeadsViewProps) {
  const [stageFilter, setStageFilter] = useState("ALL");
  const [intentFilter, setIntentFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [addApptOpen, setAddApptOpen] = useState(false);
  const [apptName, setApptName] = useState("");
  const [apptPhone, setApptPhone] = useState("947");
  const [apptIssue, setApptIssue] = useState("");
  const [apptTime, setApptTime] = useState("Tomorrow, 10:30 AM");
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const filtered = leads.filter((l) => {
    if (stageFilter !== "ALL" && l.stage !== stageFilter) return false;
    if (intentFilter !== "ALL" && l.intent !== intentFilter) return false;
    if (
      search &&
      !l.customerName.toLowerCase().includes(search.toLowerCase()) &&
      !l.phone.includes(search) &&
      !l.issueSummary.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleStageChange = async (leadId: string, stage: string) => {
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_LEAD", leadId, stage }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (leadId: string) => {
    const note = noteMap[leadId];
    if (!note?.trim()) return;
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_LEAD", leadId, note: note.trim() }),
      });
      setNoteMap((prev) => ({ ...prev, [leadId]: "" }));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptName.trim() || !apptPhone.trim()) return;

    setSubmitting(true);
    try {
      await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_APPOINTMENT",
          customerName: apptName.trim(),
          phone: apptPhone.trim(),
          issueSummary: apptIssue.trim(),
          nextFollowUpAt: apptTime.trim(),
        }),
      });
      setApptName("");
      setApptPhone("947");
      setApptIssue("");
      setAddApptOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            Leads Pipeline & Appointments
          </h2>
          <p className="text-xs text-slate-400">
            Automated WhatsApp lead capture, appointment booking & qualification pipeline.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddApptOpen(true)}
          leftIcon={<CalendarPlus className="w-4 h-4" />}
        >
          Book Appointment
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search leads by name, phone or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Pipeline Stage Dropdown with Clear Description */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">All Lead Stages</option>
            <option value="NEW">New (Uncontacted Inquiries)</option>
            <option value="CONTACTED">Contacted (In Discussion)</option>
            <option value="SCHEDULED">Scheduled (Appointment Booked)</option>
            <option value="COMPLETED">Completed / Converted</option>
          </select>
        </div>
      </div>

      {/* Leads List / Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-8 h-8" />}
          title="No leads in this stage"
          description="Qualified incoming inquiries from WhatsApp will be added here automatically."
          actionLabel="Book New Appointment"
          onAction={() => setAddApptOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => {
            const intentVariant =
              lead.intent === "HIGH_INTENT"
                ? "success"
                : lead.intent === "URGENT_ESCALATION"
                ? "danger"
                : lead.intent === "ENGAGED"
                ? "primary"
                : "neutral";

            return (
              <div
                key={lead.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{lead.customerName}</h4>
                      <p className="text-xs text-slate-400 font-mono">{lead.phone}</p>
                    </div>
                    <Badge variant={intentVariant} size="sm">
                      {lead.intent.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-2">
                    {lead.issueSummary || "Inquiry received via WhatsApp"}
                  </p>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Follow-up:</span>
                      <span className="font-semibold text-amber-400">
                        {lead.nextFollowUpAt || "Today"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Town:</span>
                      <span className="text-slate-300">{lead.town || "Colombo"}</span>
                    </div>
                  </div>
                </div>

                {/* Stage selector and note */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Stage:</span>
                    <select
                      value={lead.stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>

                  {/* Quick note input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add follow-up note..."
                      value={noteMap[lead.id] || ""}
                      onChange={(e) =>
                        setNoteMap((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                      className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddNote(lead.id)}
                      className="px-2 py-1 text-xs"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal
        isOpen={addApptOpen}
        onClose={() => setAddApptOpen(false)}
        title="Schedule Customer Appointment"
        description="Book a client call, consultation, or site visit with automated follow-up."
        maxWidth="md"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Client Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kasun Fernando"
              value={apptName}
              onChange={(e) => setApptName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              WhatsApp Phone *
            </label>
            <input
              type="text"
              required
              placeholder="94771234567"
              value={apptPhone}
              onChange={(e) => setApptPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Appointment Reason / Scope
            </label>
            <input
              type="text"
              placeholder="Custom bulk order quotation discussion"
              value={apptIssue}
              onChange={(e) => setApptIssue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Date & Scheduled Time
            </label>
            <input
              type="text"
              placeholder="Tomorrow, 10:30 AM"
              value={apptTime}
              onChange={(e) => setApptTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddApptOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Book & Notify
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

