import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Apex Escalation Hub" },
      { name: "description", content: "How Apex Escalation Hub handles visitor data, browser storage, AI requests and uploaded files." },
      { property: "og:title", content: "Privacy Notice — Apex Escalation Hub" },
      { property: "og:description", content: "What Apex Escalation Hub records, what stays in your browser and who receives data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Notice" updated="12 November 2026">
      <p>This notice explains what data Apex Escalation Hub (the “Platform”) handles when you visit or use it.</p>
      <h2>1. Visitor analytics</h2>
      <p>We use Lovable's built-in visitor analytics. It uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify visitors. Lovable collects this data for us. <a className="underline" href="https://lovable.dev/privacy">Lovable's privacy policy</a> explains how it handles it.</p>
      <p>On this site it records the pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, and errors. Detailed data is kept for 90 days and daily summaries for a year. This is recorded for every visitor, without cookies and without identifying anyone.</p>
      <h2>2. Data stored in your browser</h2>
      <p>The demo workspace saves your board, settings, dashboard layout and menu preference in your own browser's local storage so they remain after reloading. This data is not sent to our servers and you can remove it at any time by clearing your browser's site data.</p>
      <h2>3. Uploaded spreadsheets</h2>
      <p>CSV and Excel files you import are read inside your browser. They are not uploaded to our servers.</p>
      <h2>4. AI features</h2>
      <p>When you use an AI feature (standup briefing, supplier message drafting or inbound update reading), the relevant board details and any text you paste are sent through our server to Groq, an AI provider, to generate the response. We do not store this content. Avoid pasting personal or confidential information you do not want processed by that provider.</p>
      <h2>5. Fonts</h2>
      <p>Pages load fonts from Google Fonts, which means your browser contacts Google's servers and shares your IP address with Google when fonts are fetched.</p>
      <h2>6. Your rights and contact</h2>
      <p>Depending on where you live, you may have rights to access or delete personal data. Because the Platform does not identify visitors, most data cannot be linked to you. For questions, contact the owner of Apex Escalation Hub.</p>
    </LegalPage>
  );
}
