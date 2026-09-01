import React from "react";
import BackButton from "@/components/BackButton";
import JournalForm from "@/components/JournalForm";

export default function JournalNew() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/journal" label="Back to Journal" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Log a Session</h1>
          <JournalForm />
        </div>
      </main>
    </div>
  );
}