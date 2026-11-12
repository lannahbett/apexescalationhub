import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Apex Escalation Hub" },
      { name: "description", content: "Terms governing access to Apex Escalation Hub, including ownership of its software, brand, logo and content." },
      { property: "og:title", content: "Terms of Use — Apex Escalation Hub" },
      { property: "og:description", content: "Ownership, permitted use and restrictions for the Apex Escalation Hub prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="12 November 2026">
      <p>These terms govern your access to and use of Apex Escalation Hub (the “Platform”), including its website, demo workspace, launch film, documentation and any related material. By using the Platform you agree to these terms. If you do not agree, do not use it.</p>
      <h2>1. Ownership and intellectual property</h2>
      <p>The Platform and all of its content — including its software, source code, workflows, business logic, risk scoring and commercial models, user interface design, layout, text, charts, sample data, video, and the name “Apex Escalation Hub”, the Apex logo and all related brand identity — are the exclusive property of the Platform's owner and are protected by copyright, trademark, design and other intellectual property laws. All rights not expressly granted are reserved.</p>
      <h2>2. Limited evaluation licence</h2>
      <p>You receive a personal, revocable, non-exclusive, non-transferable licence to view and evaluate the Platform for the purpose of assessing it. No other right, title or licence is granted, whether by implication or otherwise.</p>
      <h2>3. Prohibited use</h2>
      <p>Without prior written permission from the owner you must not:</p>
      <ul>
        <li>copy, reproduce, clone, imitate or create derivative works of the Platform, its design, features, workflows or concept;</li>
        <li>use the Apex name, logo or brand identity, or any confusingly similar mark;</li>
        <li>reverse-engineer, decompile, scrape or extract its code, data or design;</li>
        <li>record, redistribute, resell, sublicense or publicly display the Platform or launch film;</li>
        <li>use the Platform to build or train a competing product or service.</li>
      </ul>
      <h2>4. Confidentiality</h2>
      <p>Non-public features, roadmaps and business information you see while evaluating the Platform are confidential and may not be disclosed to third parties.</p>
      <h2>5. Prototype and no warranty</h2>
      <p>The Platform is a prototype provided “as is”. Sample customers, suppliers, figures and penalties are fictional. It does not write back to any ERP system and is not a substitute for your own business, contractual or legal judgement. AI-generated text may be inaccurate and must be reviewed before use.</p>
      <h2>6. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, the owner is not liable for any indirect, incidental or consequential loss arising from use of the Platform.</p>
      <h2>7. Enforcement</h2>
      <p>Unauthorized use may result in immediate termination of access and legal action, including claims for injunctive relief and damages.</p>
      <h2>8. Changes and contact</h2>
      <p>These terms may be updated; the date above shows the latest version. For licensing, partnership or permission requests, contact the owner of Apex Escalation Hub.</p>
    </LegalPage>
  );
}
