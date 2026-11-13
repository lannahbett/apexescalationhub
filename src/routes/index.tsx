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

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Apex Escalation Hub — From Shortage to Coordinated Action" },
      {
        name: "description",
        content:
          "A focused manufacturing workspace connecting material shortages, customer commitments and supplier recovery decisions for planners, buyers and order management.",
      },
      {
        property: "og:title",
        content: "Apex Escalation Hub — From Shortage to Coordinated Action",
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
      "Prioritize missing parts by urgency, production value and recovery confidence. Keep the next action and its owner visible.",
  },
  {
    icon: ShoppingCart,
    role: "Order Management",
    question: "Which customer promise is at risk?",
    value:
      "See customer orders linked to missing parts, compare committed dates and record confirmed date changes or cancellations.",
  },
  {
    icon: Users,
    role: "Buyers & procurement",
    question: "Where does a supplier need our help?",
    value:
      "Compare planned and actual lead times, identify stalled updates and prepare focused supplier escalation messages.",
  },
  {
    icon: Factory,
    role: "Plant supply chain leaders",
    question: "Where should we focus today?",
    value:
      "Review production exposure, workflow bottlenecks and customer impact before aligning the daily recovery priorities.",
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
              Apex Escalation Hub — Manufacturing shortage decisions
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-relaxed">
              A missing part should not become a missed customer promise.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-vision-muted">
              Connect the production risk, the supplier recovery plan and the customer commitment —
              so every team can agree on what happens next.
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
                date — or change a promise without seeing the production blocker.
              </p>
              <p className="font-medium text-foreground">
                Apex brings those decisions into one focused view. It supports the morning standup,
                the recovery conversation and the next confirmed action.
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
              Different responsibilities. Connected decisions.
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
            <h2 className="mt-4 text-2xl font-semibold">Useful today. Honest about what’s next.</h2>
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
                Shared cloud boards, live multi-user collaboration, centralized audit history,
                direct ERP connectors and outbound document readiness. Board changes currently stay
                in the browser you use.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-12 md:px-8">
            <div>
              <h2 className="text-2xl font-semibold">
                Make the next shortage conversation clearer.
              </h2>
              <p className="mt-3 text-sm text-sidebar-foreground/80">
                Start with the sample board, then evaluate your own validated report.
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
