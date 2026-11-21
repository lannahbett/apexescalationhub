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
      { title: "Apex Escalation Hub | Manufacturing Shortage Resilience" },
      {
        name: "description",
        content:
          "A daily operations workspace connecting scattered shortage data, supplier recovery and customer commitments so manufacturing teams can act together to reduce delay and penalty exposure.",
      },
      {
        property: "og:title",
        content: "Apex Escalation Hub | Manufacturing Shortage Resilience",
      },
      {
        property: "og:description",
        content:
          "Turn fragmented material shortage data into coordinated daily action to protect production continuity and customer delivery promises.",
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
      "Watch recorded stock buffers and line-stop estimates throughout the shift. Review qualified alternatives and keep recovery actions visible to the teams waiting on them.",
  },
  {
    icon: ShoppingCart,
    role: "Order Management",
    question: "Which customer promise is at risk?",
    value:
      "See the orders each shortage blocks, review projected penalties and prepare customer pull-in or push-out requests. Track approvals and the SAP updates your team must make manually.",
  },
  {
    icon: Users,
    role: "Buyers & procurement",
    question: "Where does a supplier need our help?",
    value:
      "Spot lead-time drift and abnormal demand before the next missed receipt. Prepare a supplier escalation, review inbound updates and coordinate recovery with planners.",
  },
  {
    icon: Factory,
    role: "Plant supply chain leaders",
    question: "Where should we focus today?",
    value:
      "Compare risks across assembly lines and customer commitments throughout the day. Review recovery costs and repeat escalations to address the causes, not just the latest shortage.",
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
          <div className="mx-auto w-full max-w-7xl px-5 py-5 md:px-8 md:py-12">
            <p className="mb-3 text-xs font-semibold uppercase">
              Manufacturing · Daily operational resilience
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Apex Escalation Hub
            </h1>
            <p className="mt-4 max-w-2xl text-2xl font-semibold leading-tight md:text-3xl">
              One missing component can stop production. Protect the customer promise behind it.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-vision-muted">
              Bring scattered shortage data into one daily workspace. Planners, buyers and Order Management can coordinate recovery, defend agreed delivery dates and reduce exposure to delay penalties, throughout the shift.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
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
            <div className="mt-4"><VideoTour /></div>
            <p className="mt-3 text-xs text-vision-muted">
              Working prototype · sample data available · no ERP write-back
            </p>
          </div>
        </section>
        <section aria-labelledby="resilience-context" className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
            <h2 id="resilience-context" className="text-sm font-semibold">Resilience is a business priority, not just a meeting topic.</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div className="border-l-2 border-info pl-4"><p className="font-mono text-3xl font-semibold text-info">73%</p><p className="mt-2 text-sm text-muted-foreground">of surveyed organizations identify supply chain resilience as their top priority.</p></div>
              <div className="border-l-2 border-success pl-4"><p className="font-mono text-3xl font-semibold text-success">84%</p><p className="mt-2 text-sm text-muted-foreground">say humans must retain authority to validate AI-agent decisions and intervene when necessary.</p></div>
              <div className="border-l-2 border-border pl-4"><p className="text-sm font-semibold">Industry context, not Apex results</p><p className="mt-2 text-sm text-muted-foreground">Capgemini Research Institute surveyed 1,000 executives in July 2026. Apex supports human-reviewed decisions; it does not operate autonomously.</p></div>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Source: <a className="underline underline-offset-4" href="https://www.capgemini.com/insights/research-library/reinventing-supply-chains/" target="_blank" rel="noopener noreferrer">Reinventing supply chains with human-agent operations (2026)</a>, figures 11 and 15. No affiliation or endorsement implied.</p>
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
                A low-cost component can block a high-value customer order. With Apex, connect the shortage to its delivery impact, agree an owner and follow recovery through the working day. A standup is one checkpoint, not the entire process.
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
              One shared picture. Each team’s daily decisions.
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
              From early warning to confirmed recovery, all day.
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
              In a pilot, measure time to agree recovery actions, customer delivery risks identified early, on-time delivery outcomes and actual delay costs. Projected penalty exposure is not a realized saving. No delivery, savings or performance improvement is guaranteed.
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
                Automated SAP, Outlook, Teams and Power BI workflows are not active. Bring data in with validated Excel or SAP exports. Signed-out demo changes stay in your browser; authorized teammates can use the shared cloud board.
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
                Put your next shortage decision in context.
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
