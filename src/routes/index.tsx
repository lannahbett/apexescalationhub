import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Factory,
  PackageSearch,
  Users,
  ShoppingCart,
  ShieldCheck,
  ChartNoAxesCombined,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApexLogo } from "@/components/brand/apex-logo";
import floor from "@/assets/manufacturing-floor.jpg";
import { ProductShowcase } from "@/components/vision/product-showcase";
import { VideoTour } from "@/components/vision/video-tour";
import { FeedbackForm } from "@/components/vision/feedback-form";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Apex Escalation Hub | From Shortage to Coordinated Action" },
      {
        name: "description",
        content:
          "A focused manufacturing workspace connecting material shortages, customer commitments and supplier recovery decisions for planners, buyers and order management.",
      },
      {
        property: "og:title",
        content: "Apex Escalation Hub | From Shortage to Coordinated Action",
      },
      {
        property: "og:description",
        content:
          "Explore the business purpose of Apex: clearer shortage priorities, informed customer conversations and confirmed recovery actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessVision,
});
const personas = [
  {
    icon: PackageSearch,
    role: "Material planners",
    question: "What could stop the line next?",
    value:
      "Open the board at 08:00 and know which part stops your line first, who owns it and what happens next. No more rebuilding the list every morning.",
  },
  {
    icon: ShoppingCart,
    role: "Order Management",
    question: "Which customer promise is at risk?",
    value:
      "When a customer calls, you already know which of their orders a missing part blocks and whether the committed date still holds.",
  },
  {
    icon: Users,
    role: "Buyers & procurement",
    question: "Where does a supplier need our help?",
    value:
      "See which suppliers went quiet or are drifting past their lead time, and send a clear escalation in minutes instead of an hour.",
  },
  {
    icon: Factory,
    role: "Plant supply chain leaders",
    question: "Where should we focus today?",
    value:
      "Walk into the standup with one picture of production risk and customer exposure, so the meeting ends with decisions, not more questions.",
  },
];
function BusinessVision() {
  return (
    <div className="bg-background">
      <header className="bg-sidebar text-sidebar-foreground">
        <nav
          aria-label="Business page navigation"
          className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4"
        >
          <ApexLogo />
          <Button
            asChild
            variant="ghost"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Link to="/demo">
              View the demo <ArrowUpRight />
            </Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className="relative isolate flex min-h-[520px] items-center overflow-hidden bg-vision-base text-vision-foreground md:min-h-[560px]">
          <img
            src={floor}
            width={1536}
            height={1024}
            alt="Manufacturing colleagues reviewing a motor and a production order on the factory floor"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] opacity-30"
          />
          <div className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8">
            <p className="mb-5 text-xs font-semibold uppercase">
              Manufacturing · Daily shortage decisions
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Know which missing part hurts your customer most, before the customer calls.
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-relaxed">
              Apex Escalation Hub gives planners, buyers and Order Management one shared shortage board for the morning standup.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-vision-muted">
              Stop chasing answers across spreadsheets and email threads. See the line risk, the
              supplier status and the customer date in one place, and leave the meeting with a plan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-vision-foreground text-primary hover:bg-vision-muted">
                <Link to="/demo">
                  View the demo <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-vision-foreground underline underline-offset-4 hover:bg-vision-scrim hover:text-vision-foreground"
              >
                <a href="#business-context">Why it matters</a>
              </Button>
            </div>
            <div className="mt-6"><VideoTour /></div>
            <p className="mt-5 text-xs text-vision-muted">
              Working prototype · sample data available · no ERP write-back
            </p>
          </div>
        </section>
        <ProductShowcase />
        <section id="business-context" className="border-b bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1fr_1.3fr] md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase text-info">The business problem</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                One disruption.
                <br />
                Four teams. Different answers.
              </h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                A supplier slips a delivery. Production needs the part, a buyer is chasing an
                update, and Order Management is being asked whether a customer delivery will still
                happen.
              </p>
              <p>
                When those answers live in separate spreadsheets and email threads, urgency gets
                lost. Teams can pay for an expedite without knowing whether it protects the customer
                date, or change a promise without seeing the production blocker.
              </p>
              <p className="font-medium text-foreground">
                Sound familiar? With Apex, everyone opens the same board. In ten minutes you agree what
                to chase, what to tell the customer and who does it.
              </p>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-14 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase text-info">
              A shared operational picture
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Picture your own morning with Apex.
            </h2>
          </div>
          <div className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-2">
            {personas.map(({ icon: Icon, role, question, value }) => (
              <article key={role} className="border-t pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-info">
                  <Icon className="size-5" />
                  {role}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{question}</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {value}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="border-y bg-secondary">
          <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
            <p className="text-xs font-semibold uppercase text-info">From signal to action</p>
            <h2 className="mt-3 text-3xl font-semibold">
              A practical rhythm for the daily standup.
            </h2>
            <ol className="mt-8 grid gap-7 md:grid-cols-3">
              {[
                [
                  "01",
                  "See what matters",
                  "Review critical parts, supplier drift, customer date risk and workflow bottlenecks. Choose the perspective and analysis scope that fit your responsibility.",
                ],
                [
                  "02",
                  "Compare the options",
                  "Explore extra freight cost against projected penalty savings. Keep other missing-part blockers in the estimate, rather than assuming one expedite solves everything.",
                ],
                [
                  "03",
                  "Confirm the next move",
                  "Review AI suggestions, record an agreed customer date change and update the part’s status. Human confirmation stays in control.",
                ],
              ].map(([n, title, text]) => (
                <li key={n}>
                  <span className="font-mono text-sm font-semibold text-info">{n}</span>
                  <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8">
          <div>
            <ChartNoAxesCombined className="size-7 text-info" />
            <h2 className="mt-4 text-2xl font-semibold">Built for your process, not instead of it.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Designed for manufacturing teams handling material shortages, supplier recovery and
              customer delivery commitments. Apex complements your existing planning process; it is
              not an ERP, inventory allocation engine or transport booking system.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Success should be measured in your pilot: time spent preparing the standup, time to
              agree a recovery action, and customer date changes identified early. No savings or
              performance improvement is guaranteed.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5 text-success" />
                Available in the prototype
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "Interactive charts and customizable role dashboards",
                  "Validated CSV / Excel imports and board exports",
                  "Customer priority tiers, contractual penalties, or both",
                  "AI briefings and drafts; reviewed inbound update proposals",
                  "Isolated guided practice using fictional scenarios",
                ].map((s) => (
                  <li key={s} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t pt-5">
              <h3 className="font-semibold">Planned, not connected yet</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Direct connections to SAP, Outlook, Teams and Power BI. Today you bring your data in
                with a validated Excel or SAP export, and the demo keeps your changes private in
                your own browser.
              </p>
            </div>
          </div>
        </section>
        <section id="feedback" className="border-t bg-secondary">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1fr_1.2fr] md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase text-info">Your feedback</p>
              <h2 className="mt-3 text-3xl font-semibold">Does this solve your shortage problem?</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Tell us what works, what is missing and how your team handles shortages today. Every
                message is read personally.
              </p>
            </div>
            <FeedbackForm />
          </div>
        </section>
        <section className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-12 md:px-8">
            <div>
              <h2 className="text-2xl font-semibold">
                Try tomorrow's standup today.
              </h2>
              <p className="mt-3 text-sm text-sidebar-foreground/80">
                Open the sample board, play the role you work in and see the difference in five minutes.
              </p>
            </div>
            <Button
              asChild
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              <Link to="/demo">
                View the demo <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground">
        <span>Apex Escalation Hub · Manufacturing decision support</span>
        <span className="flex flex-wrap gap-4">
          <span>© 2026 Apex Escalation Hub. All rights reserved.</span>
          <Link to="/terms" className="underline underline-offset-4">Terms of use</Link>
          <Link to="/privacy" className="underline underline-offset-4">Privacy notice</Link>
        </span>
      </footer>
    </div>
  );
}
