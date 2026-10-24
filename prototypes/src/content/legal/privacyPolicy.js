/**
 * src/content/legal/privacyPolicy.js
 *
 * Structured Privacy Policy content for KisanSathi.
 * Rendered by app/privacy/page.jsx via LegalPageLayout.
 *
 * Compliance: India DPDP Act 2023 · EU GDPR · IT Act 2000
 * Last reviewed: May 2026 by legal team.
 * Word count: ~1,550 words
 */

export const PRIVACY_POLICY = {
  title:         "Privacy Policy",
  lastUpdated:   "19 May 2026",
  effectiveDate: "19 May 2026",
  version:       "2.1",

  intro: `KisanSathi Technologies Pvt. Ltd. ("KisanSathi", "we", "us", or "our") is committed to protecting the privacy of every farmer, agri-business, and visitor who uses our platform. This Privacy Policy explains what personal data we collect, why we collect it, how we use and share it, and the rights you hold under applicable Indian and international law — including the Digital Personal Data Protection Act 2023 ("DPDP Act"), the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules 2011, and the European Union General Data Protection Regulation ("GDPR") where applicable.

Please read this policy carefully before using KisanSathi. By creating an account, using our mobile application, or visiting our website, you acknowledge you have read and understood this policy. If you do not agree, please discontinue use and contact us to delete your data.`,

  sections: [
    {
      id:    "who-we-are",
      title: "1. Who We Are",
      body: `KisanSathi Technologies Pvt. Ltd. is a company incorporated under the Companies Act 2013, with its registered office at 501, Agri Innovation Tower, GIFT City, Gandhinagar, Gujarat – 382355, India. We operate the KisanSathi mobile application (iOS and Android), the web platform at kisansathi.in, and associated APIs and services (collectively, the "Platform").

For the purposes of the GDPR, KisanSathi acts as the Data Controller for personal data collected from users in the European Economic Area. For the purposes of the DPDP Act 2023, KisanSathi is the Data Fiduciary responsible for processing personal data of Indian users.

Our designated Data Protection Officer ("DPO") can be reached at dpo@kisansathi.in or by post at the registered office address above.`,
    },
    {
      id:    "data-we-collect",
      title: "2. Personal Data We Collect",
      body: `We collect personal data in the following categories:

**2.1 Account and Identity Data**
When you register, we collect your full name, mobile phone number, email address (optional), profile photograph (optional), date of birth, gender, and the state and district in which your farm is located. This data is necessary to create and secure your account.

**2.2 Farm and Agricultural Data**
To deliver our core services, we collect information about your farming activities, including the types of crops you cultivate, harvest quantities and dates, soil and weather conditions you log, product listings you create on our marketplace, and sale transaction records. This agricultural data is stored and processed to provide personalised market insights, yield recommendations, and gamification features. You remain the owner of your farm data at all times.

**2.3 Location Data**
With your explicit permission, we collect precise GPS coordinates to provide hyperlocal weather forecasts, connect you with nearby farmers, and improve market price accuracy for your region. You may revoke location permission at any time in your device settings. Approximate location (district/state level) is inferred from your profile even if precise location is disabled.

**2.4 Usage and Engagement Data**
We automatically collect data about how you interact with the Platform: screens viewed, features used, time spent, XP-earning actions, badges earned, streak data, search queries, and error logs. This data is used to improve the Platform and personalise your experience.

**2.5 Device and Technical Data**
We collect your device model, operating system, app version, unique device identifier, push notification token, IP address, and network type. This data is used for authentication, security, and push notification delivery.

**2.6 Marketplace and Financial Data**
When you transact on our marketplace, we collect listing details, buyer/seller identities, agreed prices, and payment reference numbers. We do not store full bank account numbers or card details; payment processing is handled by RBI-licensed payment aggregators.

**2.7 Communications Data**
If you contact our support team, post in the community forum, or provide feedback, we retain the content of those communications.`,
    },
    {
      id:    "how-we-use",
      title: "3. How We Use Your Data",
      body: `We use your personal data only for the purposes described below. We will not use it for any other purpose without your prior consent.

**3.1 Providing and Improving the Platform** — To create and manage your account, display your personalised leaderboard rank, award XP and badges, process marketplace transactions, deliver push notifications, and respond to support requests.

**3.2 Personalisation** — To tailor market price alerts, crop recommendations, and content to your specific crops, location, and farming history.

**3.3 Analytics and Product Development** — To understand feature usage patterns in aggregate, identify bugs, measure the effectiveness of gamification features, and guide product roadmap decisions. Where possible, we use anonymised or pseudonymised data for this purpose.

**3.4 Safety and Security** — To detect and prevent fraud, abuse, account takeovers, and violations of our Terms of Service.

**3.5 Legal Compliance** — To fulfil our obligations under applicable law, including responding to valid government requests, court orders, and regulatory inquiries.

**3.6 Communications** — To send you weekly XP summary notifications, new feature announcements, marketplace updates, and policy change notices. You may opt out of non-essential communications in Settings → Notifications.`,
    },
    {
      id:    "legal-basis",
      title: "4. Legal Basis for Processing (GDPR Users)",
      body: `For users in the European Economic Area, our legal basis for each processing activity is as follows:

- **Contract performance** — Processing necessary to provide the services you have signed up for (account management, marketplace, notifications).
- **Legitimate interests** — Analytics, security, fraud prevention, and product improvement, where our interests do not override your fundamental rights.
- **Consent** — Precise location data, marketing communications, and non-essential cookies. You may withdraw consent at any time.
- **Legal obligation** — Processing required to comply with applicable law.

Under the DPDP Act 2023, we process your data on the basis of your consent provided at registration, and for legitimate uses as defined in the Act.`,
    },
    {
      id:    "sharing",
      title: "5. How We Share Your Data",
      body: `We do not sell your personal data. We share it only in the following limited circumstances:

**5.1 Service Providers** — We share data with carefully vetted third-party processors who provide infrastructure (AWS Mumbai region), payment processing (Razorpay), push notifications (Firebase Cloud Messaging), analytics (self-hosted Posthog), and customer support tooling. All processors are contractually bound to process data only on our instructions and to apply appropriate security measures.

**5.2 Other Platform Users** — Your profile name, tier badge, state, and public community posts are visible to other KisanSathi users. Your leaderboard rank and XP score are visible to all users in the "All India" leaderboard view. You may restrict state-level visibility in Privacy Settings.

**5.3 Marketplace Counterparties** — When you complete a marketplace transaction, your name and district are shared with your trading counterpart for the purpose of completing the transaction.

**5.4 Legal Requirements** — We may disclose data to government authorities when required by a valid legal order, warrant, or regulatory requirement under Indian law or applicable international law.

**5.5 Business Transfers** — In the event of a merger, acquisition, or asset sale, your data may be transferred to the successor entity, subject to the same privacy protections described in this policy.`,
    },
    {
      id:    "your-rights",
      title: "6. Your Rights",
      body: `**Under the DPDP Act 2023 (Indian Users):**
You have the right to obtain a summary of personal data we process about you; to correct inaccurate or incomplete data; to erase your personal data (subject to legal retention obligations); to withdraw consent at any time; to appoint a nominee to exercise your rights in case of death or incapacity; and to lodge a grievance with us or with the Data Protection Board of India.

**Under the GDPR (EEA Users):**
You have the right to access your personal data; to rectification of inaccurate data; to erasure ("right to be forgotten"); to restriction of processing; to data portability in a machine-readable format; to object to processing based on legitimate interests; and to lodge a complaint with your national supervisory authority.

**Exercising Your Rights:**
To exercise any of these rights, contact us at privacy@kisansathi.in or use the in-app "Data & Privacy" section in Settings. We will respond within 30 days. Identity verification may be required before we process your request. Deleting your account permanently removes all personal data within 90 days, except data we are legally required to retain.`,
    },
    {
      id:    "retention",
      title: "7. Data Retention",
      body: `We retain your personal data for as long as your account is active. If you delete your account, we will erase personal data within 90 days, except where retention is required by law (e.g., financial transaction records retained for 7 years under Indian accounting law, or data subject to an ongoing legal dispute).

Anonymised, aggregated data (e.g., regional crop yield statistics that cannot identify you) may be retained indefinitely for research and product improvement.

Push notification tokens are deleted when you log out or uninstall the app. Usage logs are retained for 13 months and then deleted.`,
    },
    {
      id:    "security",
      title: "8. Data Security",
      body: `We implement technical and organisational measures to protect your personal data against unauthorised access, disclosure, alteration, or destruction. These measures include TLS 1.3 encryption for all data in transit, AES-256 encryption for data at rest, role-based access controls limiting staff access to personal data, regular penetration testing, and mandatory security training for all employees.

Despite these measures, no system is completely secure. If you suspect your account has been compromised, please contact security@kisansathi.in immediately.

In the event of a personal data breach that poses a risk to your rights, we will notify affected users and, where required, the Data Protection Board of India and relevant supervisory authorities within the timeframes mandated by applicable law.`,
    },
    {
      id:    "cookies",
      title: "9. Cookies and Tracking Technologies",
      body: `Our web platform uses cookies and similar technologies. We categorise these as:

- **Strictly Necessary** — Required for the Platform to function (authentication session, CSRF protection). Cannot be disabled.
- **Analytics** — Help us understand how the Platform is used (page views, feature engagement). Disabled by default; enabled only with your consent.
- **Personalisation** — Remember your preferences (language, notification settings). Enabled by default; may be disabled.
- **Marketing** — Used for advertising on third-party platforms. Disabled by default; enabled only with explicit consent.

You can manage your cookie preferences at any time via the Cookie Settings link in the footer. Withdrawing consent does not affect lawfulness of processing before withdrawal.`,
    },
    {
      id:    "children",
      title: "10. Children's Privacy",
      body: `KisanSathi is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us at privacy@kisansathi.in and we will promptly delete the information.`,
    },
    {
      id:    "international",
      title: "11. International Transfers",
      body: `Your personal data is primarily stored on servers located in AWS Mumbai (ap-south-1) within India. For certain services (push notifications via Firebase, email via SendGrid), data may be transferred to servers outside India. We ensure such transfers are protected by Standard Contractual Clauses or other lawful transfer mechanisms as required under applicable law.`,
    },
    {
      id:    "changes",
      title: "12. Changes to This Policy",
      body: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by sending a push notification and displaying a prominent in-app notice at least 30 days before the change takes effect. Your continued use of the Platform after the effective date constitutes acceptance of the updated policy. The version history is maintained at kisansathi.in/privacy/history.`,
    },
    {
      id:    "contact",
      title: "13. Contact Us",
      body: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:

**Data Protection Officer**
KisanSathi Technologies Pvt. Ltd.
501, Agri Innovation Tower, GIFT City
Gandhinagar, Gujarat – 382355, India

Email: dpo@kisansathi.in
Grievance Portal: kisansathi.in/grievance
Response time: Within 30 days of receipt

If you are an EEA resident and are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
    },
  ],
};
