import Link from 'next/link';
export const metadata = { title: 'Privacy' };

export default function Privacy() {
  const contact = process.env.PRIVACY_CONTACT || 'the operator of this WTFIT server';
  const host = process.env.HOSTING_DESCRIPTION || 'a server in the EU (Hetzner, Germany)';
  return (
    <main className="wrap app-main">
      <p className="label"><Link href="/">← WTFIT</Link></p>
      <h1 className="display page-title">Privacy, plainly.</h1>
      <div className="prose">
        <p>WTFIT needs to know a little about you to tell you whether you need the things you photograph. This page explains what it keeps, why, and how to take it all back.</p>
        <h2>What we keep</h2>
        <ul>
          <li><strong>Your account:</strong> email address and a user ID, handled by our sign-in provider (Clerk).</li>
          <li><strong>Your profile:</strong> whatever you choose to write about your homes, projects, skills, hobbies and interests, plus your public GitHub repository names if you connect them. All optional.</li>
          <li><strong>Your photos and verdicts:</strong> each photo you send and what the model concluded about it.</li>
          <li><strong>Your settings:</strong> beneficiary, currency, AI provider and, if you add one, your own API key.</li>
          <li><strong>The waitlist:</strong> if you join it, your email address and whether you confirmed it.</li>
        </ul>
        <h2>How it is protected</h2>
        <p>Your profile, your API key and your photos are encrypted with AES-256-GCM before they are written to storage. Everything runs on {host}. Nothing is sold, shared for advertising, or used to train models by us.</p>
        <h2>Who else sees it</h2>
        <ul>
          <li><strong>The AI model you choose</strong> receives the photo and your profile context to produce a verdict. With your own key, that is governed by your agreement with that provider. With the shared default, it is sent to the provider the operator configured.</li>
          <li><strong>Clerk</strong> handles sign-in. <strong>Resend</strong> sends confirmation emails.</li>
        </ul>
        <h2>Sensitive information</h2>
        <p>You never have to share anything sensitive. If you choose to write things like faith, health, relationships or identity in the &ldquo;anything else&rdquo; section, we only process it with your explicit consent (GDPR Art. 9(2)(a)), only to make recommendations for you, and never show it back in results. Clearing the box and the text withdraws consent.</p>
        <h2>Your rights</h2>
        <p>Download everything we hold about you, or delete your account and all of it, at any time from <Link href="/app/settings">Settings</Link>. Deletion removes your profile, settings, items and photos immediately. For anything else, contact {contact}.</p>
        <h2>Legal bases</h2>
        <p>Providing the service you asked for (Art. 6(1)(b)); your explicit consent for anything sensitive you choose to share (Art. 9(2)(a)); your consent for the waitlist (Art. 6(1)(a)).</p>
      </div>
    </main>
  );
}
