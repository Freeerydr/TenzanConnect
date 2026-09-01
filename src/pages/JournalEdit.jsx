import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BackButton from "@/components/BackButton";
import JournalForm from "@/components/JournalForm";
import { Loader2 } from "lucide-react";

export default function JournalEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.JournalEntry.get(id)
      .then(setEntry)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!entry) {
    navigate("/journal");
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Session</h1>
          <JournalForm existing={entry} />
        </div>
      </main>
    </div>
  );
}