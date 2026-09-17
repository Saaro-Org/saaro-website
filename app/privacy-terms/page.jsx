'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

const TABS = [
  { id: 'privacy-policy', label: 'Privacy Policy', shortLabel: 'Privacy' },
  { id: 'terms-and-conditions', label: 'Terms and Conditions', shortLabel: 'Terms' },
];

const privacySections = [
  {
    number: '01',
    title: 'What this policy covers',
    paragraphs: [
      'This Privacy Policy explains how Flux Go collects, uses, shares, and protects information when you use our website, mobile application, and related services (the “Services”).',
      'Flux Go helps people find or offer seats in intercity car rides. This policy applies to riders, drivers, visitors, and people who contact our support team.',
    ],
  },
  {
    number: '02',
    title: 'Information we collect',
    paragraphs: ['We collect only the information that we need to provide, protect, and improve the Services. This can include:'],
    bullets: [
      'Account information, such as your name, mobile number, email address when you provide one, profile photo when you choose one, and account preferences.',
      'Verification and vehicle information that we need to check a driver, a vehicle, or a ride before publication.',
      'Trip and booking information, such as route, date, time, seats, luggage, fare, booking status, cancellation, and live-trip details when you use that feature.',
      'Messages, reports, feedback, and other information that you send to another member or to Flux Go Support.',
      'Device and service information, such as device type, app version, language, crash details, security events, and basic usage records.',
      'Payment information when a paid feature is available. Our payment provider handles payment credentials. Flux Go receives the transaction status and reference needed to support your booking.',
    ],
  },
  {
    number: '03',
    title: 'How we receive information',
    paragraphs: [
      'You provide information when you create an account, complete a profile, publish a ride, request a booking, send a message, or contact support.',
      'We also receive information from your device, from service providers that help us operate the Services, and from other members who submit a safety or service report.',
    ],
  },
  {
    number: '04',
    title: 'How we use information',
    paragraphs: ['We use information for the following purposes:'],
    bullets: [
      'Provide search, ride publishing, booking, messaging, payment, and support features.',
      'Show the trip and profile details that a rider or driver needs to make an informed choice.',
      'Check accounts, vehicles, and activity. Detect fraud, abuse, unsafe conduct, and technical attacks.',
      'Send service messages about account access, bookings, changes, safety, and support cases.',
      'Fix errors, measure service performance, and improve the design and reliability of the Services.',
      'Meet legal duties, respond to lawful requests, and protect the rights and safety of members, Flux Go, and the public.',
    ],
  },
  {
    number: '05',
    title: 'When we share information',
    paragraphs: ['We share information only when it is needed for the purpose described below, or when the law permits or requires it.'],
    bullets: [
      'With a rider or driver, when limited profile and trip details are needed to arrange and complete a booking.',
      'With service providers that host, secure, support, verify, or process payments for the Services. They must follow our instructions and protect the information.',
      'With emergency services, regulators, law enforcement, or other parties when we have a legal duty or a good-faith safety reason.',
      'With a successor if Flux Go is part of a merger, sale, financing, or other business change. The receiving party must follow applicable privacy duties.',
    ],
    note: 'We do not sell your personal information. We do not share your information for another company’s direct marketing without your permission.',
  },
  {
    number: '06',
    title: 'Location and device permissions',
    paragraphs: [
      'Some features can use location from your device. We request permission before we use precise location. You can change this permission in your device settings.',
      'If you deny a permission, current-location search or another location feature may not work. We do not require precise location for every part of the Services.',
    ],
  },
  {
    number: '07',
    title: 'Your choices and privacy rights',
    paragraphs: [
      'You can review and correct some account details in the Flux Go app. You can also ask us to access, correct, delete, or restrict use of your personal information, or to withdraw consent where the law allows.',
      'Some information must remain for safety, fraud prevention, legal, accounting, or dispute reasons. We will explain a refusal when applicable law allows us to do so.',
      'Open the Flux Go app and choose Profile → Help & Support. Create a ticket with “Privacy request” in the subject, or email support@fluxgo.in. Include the account mobile number so we can verify the request. Do not send passwords or payment credentials.',
    ],
  },
  {
    number: '08',
    title: 'Retention and deletion',
    paragraphs: [
      'We keep information for as long as it is needed to provide the Services, meet legal duties, resolve disputes, enforce agreements, and protect safety. We then delete it, anonymise it, or keep it in a secure form that is no longer linked to you when possible.',
      'Some backup copies can remain for a limited period until normal backup cycles replace them. We keep access controls during that period.',
    ],
  },
  {
    number: '09',
    title: 'Security',
    paragraphs: [
      'We use reasonable technical and organisational safeguards for personal information. No internet service can promise complete security. Protect your account credentials and contact us at once through in-app support if you suspect unauthorised access.',
    ],
  },
  {
    number: '10',
    title: 'Children',
    paragraphs: [
      'The Services are for people aged 18 or older. We do not knowingly collect personal information from a child. If you believe a child has provided information, contact us through Profile → Help & Support in the Flux Go app.',
    ],
  },
  {
    number: '11',
    title: 'Transfers and applicable law',
    paragraphs: [
      'Our service providers may process information in India or another country. When information moves across borders, we use safeguards required by applicable law.',
      'This policy is a product draft for India. Flux Go will add the final legal entity details, contact details, and any required notices after legal review.',
    ],
  },
  {
    number: '12',
    title: 'Policy changes',
    paragraphs: [
      'We may update this policy when the Services or the law changes. We will post the new version on this page and update the date above. If a change is material, we will provide a clearer notice when required.',
    ],
  },
];

const termsSections = [
  {
    number: '01',
    title: 'Agreement to these terms',
    paragraphs: [
      'These Terms and Conditions govern your use of the Flux Go website, mobile application, and related services (the “Services”). By creating an account or using the Services, you agree to these terms.',
      'If you do not agree, do not create an account or use the Services. The Privacy Policy forms part of these terms.',
    ],
  },
  {
    number: '02',
    title: 'What Flux Go provides',
    paragraphs: [
      'Flux Go is a platform that helps drivers offer spare seats and helps riders find intercity car rides. Flux Go is not a taxi operator, carrier, travel agent, or insurer. A driver and a rider are responsible for their own arrangement and conduct.',
      'We can add, change, pause, or remove a feature. We do not promise that every route, ride, member, or feature will always be available.',
    ],
  },
  {
    number: '03',
    title: 'Eligibility and your account',
    paragraphs: ['You must meet all of these conditions:'],
    bullets: [
      'You are at least 18 years old and can enter a binding agreement.',
      'You provide accurate, current, and complete information. Keep it up to date.',
      'You keep your sign-in details private. Do not share your account or let another person use it.',
      'You tell us through in-app support if you suspect account misuse or unauthorised access.',
    ],
  },
  {
    number: '04',
    title: 'Driver responsibilities',
    paragraphs: [
      'A driver must have the right to use the vehicle and must hold every licence, registration, insurance policy, permit, and approval that applicable law requires. The vehicle must be safe and suitable for the published ride.',
      'Publish correct route, date, time, seat, luggage, fare, and booking information. Follow traffic rules. Do not drive when impaired, tired, or unable to drive safely. Update or cancel a ride when the plan changes.',
    ],
  },
  {
    number: '05',
    title: 'Rider responsibilities',
    paragraphs: [
      'A rider must provide correct booking information, arrive at the agreed pickup point on time, follow reasonable driver instructions, and respect the vehicle and other members.',
      'Do not bring a person, item, animal, or quantity of luggage that the booking does not allow. Ask in the app before you travel if you need an exception.',
    ],
  },
  {
    number: '06',
    title: 'Rides, bookings, and payment',
    paragraphs: [
      'A ride is available only when the app shows it as available. A booking is complete only when the app shows confirmation. A request is not a booking until the driver accepts it and the app confirms it.',
      'The app shows the fare and any platform charge before you confirm. Follow the in-app payment, cancellation, refund, and receipt instructions. A payment provider may apply its own terms. Do not send payment credentials in a message or support ticket.',
      'Cancellation outcomes depend on the ride and the policy shown in the app. If you cancel late or do not arrive, the app may show a charge, limit, or late-cancellation record where applicable.',
    ],
  },
  {
    number: '07',
    title: 'Safety and emergencies',
    paragraphs: [
      'Use your judgement before and during every ride. Confirm the vehicle and pickup details in the app. Do not enter a vehicle or continue a ride if you feel unsafe.',
      'Flux Go is not an emergency service. Call local emergency services first when there is immediate danger. Report a safety concern through in-app support as soon as you can. Use the emergency-contact feature when it is available to you.',
    ],
  },
  {
    number: '08',
    title: 'Acceptable use',
    paragraphs: ['You must not:'],
    bullets: [
      'Break the law, evade a safety check, or use the Services for an illegal purpose.',
      'Carry a weapon, dangerous substance, stolen property, or another prohibited item.',
      'Harass, threaten, abuse, discriminate against, or sexually exploit another person.',
      'Misrepresent your identity, vehicle, route, fare, booking, or reason for travel.',
      'Share an account, scrape the Services, bypass access controls, introduce malicious code, or interfere with the Services.',
      'Use a ride as a taxi or other commercial service unless Flux Go expressly permits it in writing.',
    ],
  },
  {
    number: '09',
    title: 'Messages, reports, and member content',
    paragraphs: [
      'You keep ownership of content that you submit. You give Flux Go permission to store, copy, and display that content only as needed to operate, secure, support, and improve the Services.',
      'Do not send content that is unlawful, false, private, threatening, hateful, or infringing. We may remove content or limit access when we need to protect people or the Services.',
    ],
  },
  {
    number: '10',
    title: 'Suspension and account closure',
    paragraphs: [
      'We may limit, suspend, or close an account when we reasonably believe that a person breached these terms, created a safety or fraud risk, broke the law, or harmed another member or the Services.',
      'You can stop using the Services and ask for account closure through Profile → Help & Support. Clauses that must continue, including payment, safety, privacy, intellectual property, and liability clauses, continue after closure.',
    ],
  },
  {
    number: '11',
    title: 'Flux Go content and feedback',
    paragraphs: [
      'Flux Go and its licensors own the Services, brand, software, design, and other content that we provide. We give you a limited, personal, non-transferable right to use them for their intended purpose.',
      'If you send ideas or feedback, you allow Flux Go to use them without payment or further permission. This does not transfer ownership of your personal information or member content.',
    ],
  },
  {
    number: '12',
    title: 'Disclaimers and liability',
    paragraphs: [
      'To the maximum extent allowed by law, the Services are provided as available. We do not promise that a ride, route, member, vehicle, message, payment, or feature will be safe, accurate, uninterrupted, or available.',
      'Flux Go does not control a driver’s or rider’s acts, the condition of a vehicle, road conditions, traffic, weather, or events outside our reasonable control. Nothing in these terms removes a right that applicable law does not allow us to remove.',
      'To the extent allowed by law, Flux Go is not liable for indirect, special, incidental, or consequential loss that results from use of the Services. The final terms must state any required consumer limits after legal review.',
    ],
  },
  {
    number: '13',
    title: 'Changes to the Services or terms',
    paragraphs: [
      'We may change these terms when the Services or the law changes. We will post the new version here and update the date above. If a change is material, we will give notice when required. Your continued use after the effective date means that you accept the updated terms.',
    ],
  },
  {
    number: '14',
    title: 'India legal details and contact',
    paragraphs: [
      'These are draft terms for an India intercity carpooling service. Before publication, Flux Go’s legal team must add the final legal entity name, registered address, governing law, courts or dispute process, and any required consumer notices.',
      'For questions, requests, or reports, open the Flux Go app and choose Profile → Help & Support, or email support@fluxgo.in. Create a ticket or email with a clear subject. Do not send passwords, one-time codes, or payment credentials.',
    ],
  },
];

function LegalText({ text }) {
  const chunks = text.split('support@fluxgo.in');

  return chunks.map((chunk, index) => (
    <Fragment key={`support-copy-${index}`}>
      {chunk}
      {index < chunks.length - 1 && <a href="mailto:support@fluxgo.in">support@fluxgo.in</a>}
    </Fragment>
  ));
}

function LegalSection({ section, documentId }) {
  const headingId = `legal-${documentId}-section-${section.number}`;
  const displayNumber = Number(section.number);

  return (
    <section className="legal-section" aria-labelledby={headingId}>
      <div className="legal-section-copy">
        <h3 id={headingId}>
          <span className="legal-section-number">{displayNumber}.</span> {section.title}
        </h3>
        {section.paragraphs?.map((paragraph, index) => <p key={`${section.number}-paragraph-${index}`}><LegalText text={paragraph} /></p>)}
        {section.bullets && (
          <ul>
            {section.bullets.map((bullet, index) => <li key={`${section.number}-bullet-${index}`}><LegalText text={bullet} /></li>)}
          </ul>
        )}
        {section.note && <p className="legal-note"><LegalText text={section.note} /></p>}
      </div>
    </section>
  );
}

export default function PrivacyTermsPage() {
  const [activeTab, setActiveTab] = useState('privacy-policy');
  const [year, setYear] = useState('');
  const tabRefs = useRef([]);

  useEffect(() => {
    setYear(String(new Date().getFullYear()));

    const syncTabFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (TABS.some((tab) => tab.id === hash)) setActiveTab(hash);
    };

    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    window.addEventListener('popstate', syncTabFromHash);
    return () => {
      window.removeEventListener('hashchange', syncTabFromHash);
      window.removeEventListener('popstate', syncTabFromHash);
    };
  }, []);

  const selectTab = (id, { focus = false, scroll = false } = {}) => {
    setActiveTab(id);

    if (typeof window !== 'undefined') {
      const nextUrl = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.pushState({ tab: id }, '', nextUrl);
    }

    if (focus) {
      window.setTimeout(() => tabRefs.current[TABS.findIndex((tab) => tab.id === id)]?.focus(), 0);
    }

    if (scroll) {
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
  };

  const handleTabKeyDown = (event, index) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      selectTab(TABS[index].id, { scroll: true });
      return;
    }

    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % TABS.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex === index) return;

    event.preventDefault();
    selectTab(TABS[nextIndex].id, { focus: true });
  };

  const handleAnchorClick = (event, id) => {
    event.preventDefault();
    selectTab(id, { scroll: true });
  };

  return (
    <div className="legal-page">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="legal-header" id="top">
        <div className="legal-header-inner">
          <a className="legal-back-link" href="/" aria-label="Back to home">Go Back</a>
        </div>
      </header>

      <main id="main-content" className="legal-main">
        <div className="legal-documents">
          <div className="legal-document-meta" aria-label="Document status">
            <span>India legal documents</span>
            <span>Last updated: 18 September 2026</span>
          </div>

          <div className="legal-tablist" role="tablist" aria-label="Privacy and terms documents">
            {TABS.map((tab, index) => (
              <a
                key={tab.id}
                ref={(element) => { tabRefs.current[index] = element; }}
                className="legal-tab"
                id={`tab-${tab.id}`}
                href={`#${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={(event) => handleAnchorClick(event, tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {tab.label}
              </a>
            ))}
          </div>

          <div className="legal-review-notice" role="note">
            <p><strong>Draft notice.</strong> These documents need review by a legal adviser before they become final. The final version must state the legal entity and registered address.</p>
          </div>

          <section
            className="legal-panel"
            id="privacy-policy"
            role="tabpanel"
            aria-labelledby="tab-privacy-policy"
            tabIndex={activeTab === 'privacy-policy' ? 0 : -1}
            hidden={activeTab !== 'privacy-policy'}
          >
            <div className="legal-panel-heading">
              <h1 id="legal-page-title">Privacy Policy</h1>
              <p>How Flux Go uses information to provide and protect the Services.</p>
            </div>
            <div className="legal-sections">
              {privacySections.map((section) => <LegalSection key={section.number} documentId="privacy-policy" section={section} />)}
            </div>
          </section>

          <section
            className="legal-panel"
            id="terms-and-conditions"
            role="tabpanel"
            aria-labelledby="tab-terms-and-conditions"
            tabIndex={activeTab === 'terms-and-conditions' ? 0 : -1}
            hidden={activeTab !== 'terms-and-conditions'}
          >
            <div className="legal-panel-heading">
              <h1 id="terms-page-title">Terms and Conditions</h1>
              <p>The rules for using Flux Go and sharing an intercity ride.</p>
            </div>
            <div className="legal-sections">
              {termsSections.map((section) => <LegalSection key={section.number} documentId="terms-and-conditions" section={section} />)}
            </div>
          </section>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="container legal-footer-top">
          <p>Questions about these documents? <a href="mailto:support@fluxgo.in">support@fluxgo.in</a></p>
          <a className="legal-back-link" href="#top">Back to top ↑</a>
        </div>
        <div className="container legal-footer-bottom">
          <span>© {year} Flux Go</span>
          <span><a href="#privacy-policy" onClick={(event) => handleAnchorClick(event, 'privacy-policy')}>Privacy Policy</a> · <a href="#terms-and-conditions" onClick={(event) => handleAnchorClick(event, 'terms-and-conditions')}>Terms and Conditions</a></span>
        </div>
      </footer>
    </div>
  );
}
