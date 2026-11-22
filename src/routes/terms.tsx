import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of Use | Apex Escalation Hub" },
      { name: "description", content: "Terms governing access to Apex Escalation Hub: ownership, accounts, shared board, AI features, prohibited use and liability." },
      { property: "og:title", content: "Terms of Use | Apex Escalation Hub" },
      { property: "og:description", content: "Ownership, permitted use, accounts and restrictions for Apex Escalation Hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="22 November 2026">
      <p>These terms form a binding agreement between you and the creator and owner of Apex Escalation Hub (the “Owner”) for your access to and use of the Apex Escalation Hub website, demo workspace, shared team board, product tour, launch film, documentation and all related material (together, the “Platform”). By opening, browsing, creating an account or signing in to the Platform you accept these terms. If you do not accept them, you must stop using the Platform immediately.</p>

      <h2>1. Nature of the Platform</h2>
      <p>The Platform is an original portfolio and evaluation prototype. It is offered so that recruiters, potential partners and invited teammates can assess its concept and execution. It is not a commercial service, carries no service level and may change, be suspended or be withdrawn at any time without notice.</p>

      <h2>2. Ownership and intellectual property</h2>
      <p>All rights, title and interest in the Platform belong exclusively to the Owner. This includes, without limitation: the software and source code; database design; business logic such as risk scoring, customer order pegging, commercial tier and penalty models, expedite scenarios, early-warning signals and the shipping and customs readiness gate; SAP import mappings; AI prompt and grounding design; the user interface, layout, information architecture, interaction patterns, dashboards, charts and workflow sequences; all text, explanations, handbook content, practice missions, sample and demo datasets (including sector presets), images, videos and the product tour; and all brand assets described in section 3. These are protected by copyright, trademark, unfair-competition, trade-secret, database and design laws, whether or not registered. Nothing in these terms transfers any of these rights to you. All rights not expressly granted are reserved.</p>

      <h2>3. Brand assets and trade dress</h2>
      <p>The name “Apex Escalation Hub”, the word “Apex” as used for this Platform, the Apex logo and symbol, favicon, icons drawn for the Platform, taglines, the colour palette and its combination with the Platform's typography, layout and visual style (together the “Brand Assets” and “Trade Dress”) identify the Owner as the source of the Platform. You must not:</p>
      <ul>
        <li>use, copy, alter, animate, recolour or redraw the logo or any Brand Asset, or create a logo, icon or mark that is identical or confusingly similar;</li>
        <li>adopt the Platform's colour scheme, typography and layout in combination, or any look and feel likely to suggest a connection with the Owner;</li>
        <li>register or use any company name, product name, domain, app-store listing, social media handle or keyword advertisement containing the Brand Assets or similar terms;</li>
        <li>use the Brand Assets in pitches, tenders, innovation programmes, investor material, portfolios or marketing, or claim authorship, partnership or endorsement, without written permission;</li>
        <li>present screenshots, recordings or descriptions of the Platform as your own work or product.</li>
      </ul>
      <p>Permitted exception: a brief, accurate reference to the Platform by name with a credit to the Owner and a link, which does not imply endorsement. Any other use requires a signed written licence. The Owner reserves the right to register the Brand Assets as trademarks or designs in any territory; absence of registration is not a waiver of rights.</p>

      <h2>4. Limited licence</h2>
      <p>The Owner grants you a personal, revocable, non-exclusive, non-transferable and non-sublicensable licence to view and use the Platform solely to evaluate it. Any use outside this purpose, including any commercial or production use, requires the Owner's prior written permission. The licence ends automatically if you breach these terms.</p>

      <h2>5. Prohibited conduct</h2>
      <p>Without the Owner's prior written permission you must not:</p>
      <ul>
        <li>copy, reproduce, clone, rebuild, imitate or create derivative works of the Platform or any substantial part of its design, features, workflows, data model or concept, whether by code, design tools, AI tools or manual recreation;</li>
        <li>use the Apex name, logo or brand identity, or any confusingly similar name, mark or visual style, including in domain names, products or social media;</li>
        <li>reverse-engineer, decompile, disassemble, scrape, crawl, mirror or systematically extract the Platform's code, data, prompts or design;</li>
        <li>record, screenshot for publication, redistribute, resell, rent, sublicense or publicly display the Platform, product tour or launch film, except brief references that credit the Owner and link to the Platform;</li>
        <li>use the Platform, its outputs or its content to build, benchmark or train a competing product, service or AI model;</li>
        <li>probe, scan or test the Platform's security, bypass access controls, attempt to read the shared board without being approved, or interfere with its operation;</li>
        <li>submit unlawful, harmful or misleading content, malware, or content that infringes the rights of others;</li>
        <li>remove or alter any copyright, trademark or ownership notice.</li>
      </ul>

      <h2>6. Accounts and the shared team board</h2>
      <p>An account is required to access the workspace and all of its features. You must sign in with your own identity, provide accurate information, and not share, sell or transfer your account. Automated, bulk or fake account creation is prohibited. Access to the shared team board requires signing in with a Lovable workspace account or a Google account <strong>and</strong> being approved by the Owner; signing in alone does not grant access. You are responsible for activity under your account and must keep it secure. The Owner may refuse, suspend or remove access at any time, for any reason, including suspected misuse. Changes made on the shared board are visible to other approved members and recorded in the team activity log with your name.</p>

      <h2>7. Your content</h2>
      <p>You keep ownership of data you import or type. You grant the Owner a limited licence to store, process and display it solely to operate the Platform for you and your team. You confirm you have the right to use any data you submit and that you will not upload confidential employer, customer or supplier data unless you are authorised to do so. Do not enter special-category personal data.</p>

      <h2>8. AI features</h2>
      <p>The standup briefing, supplier escalation drafting and inbound update reader send relevant content to a third-party AI provider to generate suggestions. AI output may be wrong, incomplete or outdated. It never changes the board on its own: every extracted change must be reviewed and confirmed by you. You are solely responsible for any message you send or decision you take based on AI output.</p>

      <h2>9. Feedback</h2>
      <p>If you send suggestions or feedback, the Owner may use them freely and without obligation to you.</p>

      <h2>10. Confidentiality</h2>
      <p>Non-public features, roadmaps, architecture and business information you encounter while evaluating the Platform are confidential. You must not disclose or use them except to evaluate the Platform.</p>

      <h2>11. No professional advice and no warranty</h2>
      <p>Sample customers, suppliers, parts, prices, penalties and customs requirements are fictional or illustrative. The Platform does not connect to or write back to any ERP, carrier or customs system and does not provide legal, customs, tax or contractual advice. Always verify documents and requirements with your own experts. The Platform is provided “as is” and “as available”, without warranties of any kind, express or implied, including accuracy, availability, fitness for a particular purpose and non-infringement.</p>

      <h2>12. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, the Owner is not liable for any indirect, incidental, special or consequential loss, or for loss of profit, revenue, data, production or goodwill, arising from use of or inability to use the Platform. Nothing in these terms limits liability that cannot be limited by law, such as liability for intent or gross negligence.</p>

      <h2>13. Indemnity</h2>
      <p>You agree to compensate the Owner for claims, losses and reasonable legal costs arising from your breach of these terms or your misuse of the Platform.</p>

      <h2>14. Enforcement</h2>
      <p>Each use of a Brand Asset or each reproduction of the Platform in breach of these terms is a separate infringement. The Owner may log account activity to detect misuse and may preserve that evidence. Breach of these terms may lead to immediate termination of access, removal of your data from the shared board and legal action, including claims for injunctive relief, takedown requests, damages and recovery of legal costs. Failure to enforce a provision is not a waiver of it.</p>

      <h2>15. Governing law</h2>
      <p>These terms are governed by the laws of Hungary, without affecting mandatory consumer protections of your country of residence. Courts competent for the Owner's place of residence have jurisdiction, unless mandatory law provides otherwise.</p>

      <h2>16. Changes, severability and contact</h2>
      <p>The Owner may update these terms; the date above shows the current version, and continued use means acceptance. If any provision is found unenforceable, the rest remains in effect. For licensing, partnership or permission requests, contact the Owner of Apex Escalation Hub.</p>
    </LegalPage>
  );
}
