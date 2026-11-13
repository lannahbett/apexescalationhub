import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Notice | Apex Escalation Hub" },
      { name: "description", content: "How Apex Escalation Hub handles sign-in, the shared team board, browser storage, AI requests and uploaded files." },
      { property: "og:title", content: "Privacy Notice | Apex Escalation Hub" },
      { property: "og:description", content: "What Apex Escalation Hub collects, why, who receives it, how long it is kept and your rights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Notice" updated="13 November 2026">
      <p>This notice explains what personal data Apex Escalation Hub (the “Platform”) processes, why, who receives it and what rights you have. The Owner of the Platform is the data controller. We collect only what the Platform needs to work and we never sell personal data or use it for advertising.</p>

      <h2>1. Using the demo without signing in</h2>
      <p>You can use the full demo without an account. In that case your board, settings, dashboard layout, role perspective, commercial mode, shipping readiness choices and menu preference are saved only in your own browser's local storage. They are not sent to our servers. You can delete them at any time with “Reset” in the demo or by clearing this site's data in your browser.</p>

      <h2>2. Signing in</h2>
      <p>Signing in is optional and only needed for the shared team board. Two methods exist:</p>
      <ul>
        <li><strong>Lovable workspace account:</strong> if you are signed in to Lovable, the Platform receives your Lovable user ID, display name and email to recognise you.</li>
        <li><strong>Google account:</strong> if you choose “Continue with Google”, Google shares your name, email address, profile picture and a Google account ID with us. A sign-in session is stored in your browser so you stay signed in until you sign out.</li>
      </ul>
      <p>Signing in does not by itself give access to the shared board; the Owner must approve members. Legal basis: your request to use the shared board and our legitimate interest in securing it.</p>

      <h2>3. Shared team board and activity log</h2>
      <p>For approved members, parts and order data on the shared board are stored in our hosted database and shown live to other approved members. Each change is recorded in a team activity log with your display name, the time and a short summary of what changed. This log is append-only so the team can trust its history. Board data and activity are kept while the shared board is in use and deleted when you or the Owner remove them or the Platform is retired.</p>

      <h2>4. Uploaded spreadsheets</h2>
      <p>CSV and Excel files are read inside your browser. The files themselves are never uploaded. If you are signed in to the shared board and confirm an import, only the validated rows are saved to the shared board as described above.</p>

      <h2>5. AI features</h2>
      <p>When you use the standup briefing, supplier escalation drafter or inbound update reader, the relevant board details and any text you paste or type (such as a supplier email or sender name) are sent through our server to Groq, Inc., an AI provider, to generate the response. We do not store this content ourselves. Groq processes it under its own terms and may handle it outside the EU. Do not paste personal, confidential or customer data you are not authorised to share.</p>

      <h3>Feedback form</h3>
      <p>If you send feedback from the home page, we store your message, rating, chosen area and, only if you enter it, your email address. We use it solely to improve the Platform and to reply to you. It is never sold or published. You can ask for it to be deleted at any time.</p>
      <h2>6. Visitor analytics</h2>
      <p>We use Lovable's built-in visitor analytics. It uses no cookies, stores nothing on your device, doesn't keep IP addresses and doesn't identify visitors. Lovable collects this data for us. <a className="underline" href="https://lovable.dev/privacy">Lovable's privacy policy</a> explains how it handles it.</p>
      <p>On this site it records the pages visited, where visitors came from, their country, browser, operating system and device type, how long they stay, how fast pages load, and errors. Detailed data is kept for 90 days and daily summaries for a year. This is recorded for every visitor, without cookies and without identifying anyone.</p>

      <h2>7. Fonts</h2>
      <p>Pages load fonts from Google Fonts, so your browser contacts Google's servers and shares your IP address with Google when fonts are fetched.</p>

      <h2>8. Who receives data</h2>
      <ul>
        <li>Lovable, hosting, database, sign-in and analytics.</li>
        <li>Google, Google sign-in (only if you choose it) and fonts.</li>
        <li>Groq, AI features (only when you use them).</li>
        <li>Other approved members of the shared board, your name and changes.</li>
      </ul>
      <p>Some providers may process data outside the European Economic Area under their own safeguards, such as standard contractual clauses. We disclose data to authorities only where legally required.</p>

      <h2>9. Security</h2>
      <p>Data is sent over encrypted connections. The shared board is protected by database access rules so only approved members can read or change it, and AI requests are validated before they are sent. No system is perfectly secure, so please avoid entering sensitive information.</p>

      <h2>10. Your rights</h2>
      <p>Under the GDPR and similar laws you may request access to, correction or deletion of your personal data, restriction of or objection to its processing, and data portability, and you may withdraw consent at any time by signing out and asking us to delete your data. You also have the right to complain to a data protection authority; in Hungary this is the National Authority for Data Protection and Freedom of Information (NAIH). To exercise your rights, contact the Owner of Apex Escalation Hub.</p>

      <h2>11. Children</h2>
      <p>The Platform is a professional tool and is not intended for anyone under 16.</p>

      <h2>12. Changes</h2>
      <p>We may update this notice; the date above shows the current version.</p>
    </LegalPage>
  );
}
