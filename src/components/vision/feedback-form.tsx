import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendFeedback, feedbackSchema } from "@/lib/feedback.functions";
import { cn } from "@/lib/utils";

const roles = ["Order Management", "Material planning", "Purchasing / buying", "Supply chain leadership", "Other"];

export function FeedbackForm() {
  const [rating, setRating] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse({ rating, role: role || null, message, email: email || null });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check the form"); return; }
    setError(null); setBusy(true);
    try { await sendFeedback({ data: parsed.data }); setDone(true); }
    catch { setError("Your feedback could not be sent. Please try again."); }
    finally { setBusy(false); }
  }

  if (done) return <p role="status" className="rounded-lg border bg-card p-6 text-base font-medium">Thank you. Your feedback has been received and will shape what we build next.</p>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5" noValidate>
      <fieldset>
        <legend className="text-sm font-medium">How useful would Apex be for your team?</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-pressed={rating === n} aria-label={`${n} of 5`}
              className="grid size-11 place-items-center rounded-md hover:bg-secondary">
              <Star className={cn("size-6", rating && n <= rating ? "fill-elevated text-elevated" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">Your area
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Choose (optional)</option>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">What would make this work for you?
        <textarea required value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={4}
          className="mt-1 w-full rounded-md border bg-background p-3 text-sm" placeholder="The problem you face, a feature you need, or anything that felt unclear" />
      </label>
      <label className="block text-sm font-medium">Email, if you would like a reply
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255}
          className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm" placeholder="name@company.com" />
      </label>
      {error && <p role="alert" className="text-sm text-critical">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11">{busy ? "Sending..." : "Send feedback"}</Button>
    </form>
  );
}
