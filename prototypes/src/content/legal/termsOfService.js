/**
 * src/content/legal/termsOfService.js
 *
 * Structured Terms of Service content for KisanSathi.
 * Rendered by app/terms/page.jsx via LegalPageLayout.
 *
 * Compliance: Indian Contract Act 1872 · Consumer Protection Act 2019
 *             IT Act 2000 · Agricultural Produce (Grading and Marking) Act
 * Last reviewed: May 2026 by legal team.
 * Word count: ~2,050 words
 */

export const TERMS_OF_SERVICE = {
  title:         "Terms of Service",
  lastUpdated:   "19 May 2026",
  effectiveDate: "19 May 2026",
  version:       "3.0",

  intro: `Welcome to KisanSathi. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and KisanSathi Technologies Pvt. Ltd. ("KisanSathi", "we", "us", or "our"), governing your access to and use of the KisanSathi mobile application, website at kisansathi.in, APIs, and all related services (collectively, the "Platform").

By creating an account, downloading the app, or using any part of the Platform, you confirm that you have read, understood, and agreed to be bound by these Terms. If you are using the Platform on behalf of an agri-business or cooperative, you represent that you have authority to bind that entity to these Terms, and "you" refers to both you and that entity.

If you do not agree with any part of these Terms, you must discontinue use of the Platform immediately.`,

  sections: [
    {
      id:    "eligibility",
      title: "1. Eligibility and Account Registration",
      body: `**1.1 Age Requirement.** You must be at least 18 years of age to use the Platform. By registering, you confirm that you meet this requirement. We reserve the right to terminate accounts found to belong to minors.

**1.2 Accurate Information.** You agree to provide accurate, current, and complete information during registration and to keep your profile updated. Providing false or misleading information, including impersonating another person or creating multiple accounts to circumvent restrictions, is a material breach of these Terms and will result in immediate account suspension.

**1.3 Account Security.** You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Notify us immediately at security@kisansathi.in if you suspect unauthorised access. We are not liable for losses resulting from your failure to safeguard your credentials.

**1.4 One Account Per User.** Each individual may maintain only one personal account. Agri-businesses and cooperatives may maintain a separate business account, subject to our Business Account Terms available on request.`,
    },
    {
      id:    "platform-services",
      title: "2. Platform Services",
      body: `**2.1 Service Description.** KisanSathi provides a digital platform for Indian farmers and agri-businesses that includes: crop scanning and identification tools; live and historical mandi price data; personalised farming tips and knowledge resources; a gamification system (XP points, badges, leaderboard, tier progression); a peer-to-peer and business-to-farmer agricultural marketplace; community forums and peer networking; and weather forecasting tools.

**2.2 Service Availability.** We aim to provide the Platform 24/7 but do not guarantee uninterrupted availability. Scheduled maintenance will be announced via push notification at least 12 hours in advance. We are not liable for service interruptions caused by factors beyond our reasonable control, including internet outages, power failures, government actions, or natural disasters.

**2.3 Free and Paid Features.** Core features of the Platform are provided free of charge. Certain premium features, enhanced analytics, and priority marketplace placement may be offered as paid subscriptions or one-time purchases. Pricing, billing terms, and refund policies for paid features are set out in our Subscription Policy, incorporated herein by reference.

**2.4 Third-Party Services.** The Platform may integrate with or link to third-party services (weather providers, payment processors, logistics partners). Your use of third-party services is governed by their respective terms and privacy policies. KisanSathi is not responsible for the availability, accuracy, or practices of third-party services.`,
    },
    {
      id:    "marketplace",
      title: "3. Marketplace Rules",
      body: `**3.1 Marketplace Overview.** The KisanSathi Marketplace ("Marketplace") facilitates direct transactions between farmers (sellers) and buyers, including wholesalers, retailers, and agri-businesses. KisanSathi acts as a facilitator, not a party to any transaction, and does not take possession of agricultural produce at any point.

**3.2 Seller Responsibilities.** By listing produce on the Marketplace, you represent and warrant that: you are the legal owner of or authorised to sell the produce; the produce meets the quality, weight, and grading standards you have stated; the produce complies with all applicable food safety, packaging, and labelling regulations; and you will fulfil the transaction at the agreed price and terms. KisanSathi reserves the right to remove listings that are inaccurate, fraudulent, or in violation of applicable law.

**3.3 Buyer Responsibilities.** Buyers are responsible for independently verifying the quality and quantity of produce before finalising a transaction. KisanSathi provides quality reporting tools but does not guarantee the accuracy of seller-provided quality claims. Buyers assume full risk once a transaction is marked as delivered and the dispute window has closed.

**3.4 Pricing and Transactions.** All prices on the Marketplace are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise. KisanSathi may charge a platform fee (currently 1.5% of transaction value, subject to change with 30 days' notice) on completed transactions. Payment must be made via approved payment methods within the Platform. Cash transactions arranged outside the Platform are not protected by our dispute resolution process.

**3.5 Cancellations and Refunds.** Sellers may cancel a listing before a buyer confirms an order. After order confirmation, cancellation is subject to our Cancellation Policy. Buyers may request a refund within 48 hours of delivery if produce is materially different from the listing description. Disputes are resolved under Clause 12 of these Terms.

**3.6 Prohibited Listings.** The following are strictly prohibited on the Marketplace: adulterated, expired, or unsafe produce; produce obtained through illegal means; pesticides, fertilisers, or agri-chemicals not registered under the Insecticides Act 1968 or the Fertiliser Control Order; seeds not certified by the National Seeds Corporation or state seed certification agencies; and any items prohibited under applicable Indian law. Violation will result in immediate listing removal and may result in account suspension and reporting to relevant authorities.

**3.7 Marketplace Ratings.** Both buyers and sellers may leave ratings and reviews after each transaction. Ratings must be honest and based on actual experience. Attempting to manipulate ratings (self-rating, fake reviews, coercion) is prohibited and may result in account suspension.`,
    },
    {
      id:    "user-conduct",
      title: "4. User Conduct",
      body: `**4.1 Community Standards.** KisanSathi is a professional platform serving farming communities across India. You agree to conduct yourself respectfully and professionally in all interactions, including community posts, messaging, and marketplace communications.

**4.2 Prohibited Activities.** You must not use the Platform to:
- Post content that is abusive, harassing, threatening, defamatory, obscene, or discriminatory on the basis of caste, religion, gender, region, or any other protected characteristic;
- Spread misinformation about crop diseases, market prices, government schemes, or farming practices that could cause harm to other farmers;
- Spam other users with unsolicited commercial messages;
- Circumvent or attempt to circumvent any security feature, rate limit, or access control;
- Scrape, crawl, or systematically extract data from the Platform without written permission;
- Use the Platform for any illegal purpose, including money laundering, tax evasion, or violation of export control laws;
- Introduce malware, viruses, or any code intended to disrupt, damage, or gain unauthorised access to the Platform.

**4.3 Gamification Integrity.** The XP, badge, streak, and leaderboard systems are designed to recognise genuine platform engagement. Artificially inflating XP or badges through scripts, bots, coordinated inauthentic behaviour, or exploitation of bugs is prohibited. We reserve the right to adjust, reset, or revoke XP and badges obtained through such means.

**4.4 User Content.** By posting content on the Platform (community posts, product listings, photos, reviews), you grant KisanSathi a non-exclusive, royalty-free, worldwide licence to use, reproduce, modify, and display that content for the purposes of operating and promoting the Platform. You retain ownership of your content and may delete it at any time. You represent that you own or have the necessary rights to post any content you submit.`,
    },
    {
      id:    "intellectual-property",
      title: "5. Intellectual Property",
      body: `**5.1 KisanSathi IP.** The Platform, including its design, code, algorithms, brand marks, crop identification models, and data compilations, is owned by KisanSathi Technologies Pvt. Ltd. and is protected by Indian and international intellectual property laws. Nothing in these Terms transfers ownership of KisanSathi's intellectual property to you.

**5.2 Licence to Use.** KisanSathi grants you a limited, non-exclusive, non-transferable, revocable licence to use the Platform for your personal or business farming activities, strictly in accordance with these Terms. This licence does not permit: sublicensing or reselling access to the Platform; reverse engineering, decompiling, or disassembling the app; removing proprietary notices; or using KisanSathi branding without written consent.

**5.3 Feedback.** If you submit ideas, suggestions, or feedback to KisanSathi, you grant us an irrevocable, royalty-free right to use such feedback without any obligation to you.`,
    },
    {
      id:    "disclaimers",
      title: "6. Disclaimers and Limitation of Liability",
      body: `**6.1 "As Is" Service.** The Platform is provided "as is" and "as available". To the maximum extent permitted by applicable law, KisanSathi disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, accuracy of market price data, and non-infringement. Market price data is sourced from public mandis and third parties and may not reflect real-time prices at your local market.

**6.2 Agricultural Decisions.** Farming decisions — including what to plant, when to sell, and what inputs to use — are complex and depend on many factors beyond our platform. KisanSathi's crop recommendations, market price alerts, and weather data are informational tools only. We do not guarantee any particular farm yield or income outcome. You are solely responsible for decisions made based on Platform data.

**6.3 Limitation of Liability.** To the maximum extent permitted by Indian law, KisanSathi's total aggregate liability to you for any claims arising from or relating to the Platform shall not exceed the greater of: (a) the fees you paid to KisanSathi in the 12 months preceding the claim, or (b) ₹5,000 (Indian Rupees Five Thousand). We are not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of crops, loss of income, or loss of data.

**6.4 Consumer Protection.** Nothing in these Terms limits your rights under the Consumer Protection Act 2019 or other mandatory applicable law that cannot be excluded by contract.`,
    },
    {
      id:    "indemnification",
      title: "7. Indemnification",
      body: `You agree to indemnify, defend, and hold harmless KisanSathi, its officers, directors, employees, and partners from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: your violation of these Terms; your violation of any third-party right, including intellectual property or privacy rights; any content you post on the Platform; or any transaction you enter into through the Marketplace. KisanSathi reserves the right to assume exclusive control of any matter subject to indemnification at your expense.`,
    },
    {
      id:    "termination",
      title: "8. Account Termination",
      body: `**8.1 By You.** You may close your account at any time through Settings → Account → Delete Account. Deletion is permanent and takes effect within 90 days, subject to our data retention obligations.

**8.2 By KisanSathi.** We may suspend or permanently terminate your account, with or without notice, if you materially breach these Terms, engage in fraudulent marketplace activity, or if required by law. In cases of clear fraud or imminent harm, we may act without prior notice. We will endeavour to provide advance notice and an opportunity to respond in other cases.

**8.3 Effect of Termination.** Upon termination, your licence to use the Platform ends immediately. Completed marketplace transactions, obligations arising therefrom, and provisions that by their nature should survive (including Clauses 4.4, 5, 6, 7, 9, and 10) will remain in effect.`,
    },
    {
      id:    "dispute-resolution",
      title: "9. Dispute Resolution",
      body: `**9.1 Marketplace Disputes.** For disputes between buyers and sellers arising from a marketplace transaction, you must first attempt to resolve the matter directly with the other party within 48 hours. If unresolved, you may raise a dispute through our in-app Dispute Centre within 7 days of the delivery date. Our dispute resolution team will review evidence from both parties and issue a decision within 10 business days. Our decisions are final within the Platform but do not preclude recourse to courts.

**9.2 Disputes with KisanSathi.** For disputes with KisanSathi, please first contact our Grievance Officer at grievance@kisansathi.in. We will attempt to resolve the matter within 30 days. If unresolved, disputes shall be referred to arbitration under the Arbitration and Conciliation Act 1996, conducted in Ahmedabad, Gujarat, in English, before a sole arbitrator mutually agreed upon by the parties.

**9.3 Governing Law.** These Terms are governed by the laws of India. Subject to the arbitration clause above, you irrevocably submit to the exclusive jurisdiction of courts in Ahmedabad, Gujarat, for any legal action or proceeding arising under these Terms.

**9.4 Class Action Waiver.** To the extent permitted by law, you waive any right to participate in a class action lawsuit or class-wide arbitration against KisanSathi.`,
    },
    {
      id:    "general",
      title: "10. General Provisions",
      body: `**10.1 Entire Agreement.** These Terms, together with our Privacy Policy, Cookie Policy, Marketplace Seller Policy, and Subscription Policy, constitute the entire agreement between you and KisanSathi regarding the Platform, superseding all prior agreements.

**10.2 Amendments.** We may modify these Terms at any time. We will notify you of material changes via push notification and in-app banner at least 30 days before the new Terms take effect. Your continued use after the effective date constitutes acceptance. If you do not accept the new Terms, you must stop using the Platform and may request account deletion.

**10.3 Severability.** If any provision of these Terms is found to be unenforceable, the remaining provisions continue in full force and effect.

**10.4 Waiver.** Failure by KisanSathi to enforce any provision of these Terms does not constitute a waiver of our right to enforce it in the future.

**10.5 Assignment.** You may not assign your rights or obligations under these Terms without our written consent. KisanSathi may assign these Terms in connection with a merger, acquisition, or sale of assets.

**10.6 Language.** These Terms are drafted in English. In the event of any conflict between an English version and any translation, the English version prevails.

**10.7 Contact.** For questions about these Terms, contact our legal team at legal@kisansathi.in or write to us at 501, Agri Innovation Tower, GIFT City, Gandhinagar, Gujarat – 382355, India.`,
    },
  ],
};
