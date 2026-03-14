import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPolicy: React.FC = () => (
  <div className="min-h-screen bg-background">
    <Header />

    {/* Hero */}
    <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
      <div className="container text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
          Learn how we collect, use, and protect your personal data when you order from Lebanese Flames.
        </p>
      </div>
    </section>

    {/* Content */}
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-yellow-50 via-white to-orange-50 rounded-2xl shadow-lg border border-yellow-200 px-6 sm:px-8 py-8 md:py-10 text-justify">
          <div className="flex items-center gap-3 mb-4">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 text-3xl shadow">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-700 tracking-tight">
              Privacy Policy
            </h2>
          </div>
          <p className="mb-4 text-yellow-800 font-semibold">Last updated: March 2026</p>
          <p className="mb-4">
        Lebanese Flames respects your privacy and are committed to protecting your personal data. This Privacy Policy
        explains how we collect, use, and protect information when you visit lebanesflames.uk or interact with our
        services. The website is operated by Lebanese Flames, located at 381 Footscray Road, New Eltham, London SE9
        2DR, United Kingdom.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
          <p className="mb-4">
        We may collect personal information that you voluntarily provide when contacting us, placing orders, or
        interacting with our website. This information may include your name, phone number, email address, delivery
        address, and any other details you choose to provide. We may also collect limited technical data automatically
        when you visit the website, such as IP address, browser type, device information, and website usage data
        through cookies or analytics tools.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Information</h2>
          <p className="mb-4">
        We use the information we collect to operate and improve our website and services. This includes responding to
        enquiries, processing orders, providing customer support, improving website performance, and communicating with
        customers when necessary. Your information may also be used to comply with legal obligations or prevent
        fraudulent or harmful activity.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Orders and Third-Party Platforms</h2>
          <p className="mb-4">
        Online food orders may be processed through third-party delivery platforms such as Just Eat, Uber Eats, or
        Deliveroo. When you place an order through these platforms, they may collect and process your personal data
        according to their own privacy policies. Lebanese Flames only receives the information necessary to prepare and
        deliver your order.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Cookies and Website Analytics</h2>
          <p className="mb-4">
        Our website may use cookies and similar technologies to enhance user experience, analyse website traffic, and
        improve functionality. Cookies are small files stored on your device that help us understand how visitors
        interact with the website. You may control or disable cookies through your browser settings, although some
        website features may not function properly if cookies are disabled.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Data Sharing</h2>
          <p className="mb-4">
        We do not sell or rent your personal information to third parties. However, we may share necessary information
        with service providers that help us operate our website, process payments, or deliver services. These providers
        are required to protect your information and use it only for the purposes for which it was shared.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Data Security</h2>
          <p className="mb-4">
        We take reasonable technical and organisational measures to protect your personal data from unauthorised
        access, loss, misuse, or alteration. However, no online system is completely secure, and we cannot guarantee
        absolute security of information transmitted through the internet.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Your Data Rights</h2>
          <p className="mb-4">
        Under United Kingdom data protection laws, including the UK General Data Protection Regulation (UK GDPR), you
        may have rights regarding your personal data. These rights may include requesting access to the personal data we
        hold about you, requesting correction of inaccurate information, requesting deletion of your data where
        appropriate, or objecting to certain types of data processing.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Data Retention</h2>
          <p className="mb-4">
        We retain personal data only for as long as necessary to fulfil the purposes described in this Privacy Policy,
        including legal, accounting, or reporting requirements.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Links to Other Websites</h2>
          <p className="mb-4">
        Our website may contain links to third-party websites or delivery platforms. We are not responsible for the
        privacy practices or content of those external websites.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Changes to This Privacy Policy</h2>
          <p className="mb-4">
        We may update this Privacy Policy from time to time to reflect changes in our services or legal requirements.
        The updated version will be posted on this page with a revised “Last updated” date.
      </p>
    <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
          <address className="not-italic mb-4">
      Lebanese Flames<br />
      381 Footscray Road<br />
      New Eltham, London SE9 2DR<br />
      United Kingdom<br />
      Phone: <a href="tel:+447466305669" className="text-blue-600 underline">+44 7466 305669</a><br />
      Email: <a href="mailto:info.lebanesflames@gmail.com" className="text-blue-600 underline">info.lebanesflames@gmail.com</a>
    </address>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default PrivacyPolicy;
