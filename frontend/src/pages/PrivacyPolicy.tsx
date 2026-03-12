import React from "react";

const PrivacyPolicy: React.FC = () => (
  <div className="container mx-auto p-6 max-w-3xl">
    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p className="mb-2">This Privacy Policy explains how we collect, use, and protect your information when you use our services. We are committed to safeguarding your privacy and ensuring your personal information is protected.</p>
    <h2 className="text-xl font-semibold mt-4 mb-2">Information We Collect</h2>
    <ul className="list-disc ml-6 mb-2">
      <li>Personal identification information (Name, email address, phone number, etc.)</li>
      <li>Order and payment details</li>
      <li>Usage data and cookies</li>
    </ul>
    <h2 className="text-xl font-semibold mt-4 mb-2">How We Use Your Information</h2>
    <ul className="list-disc ml-6 mb-2">
      <li>To process orders and manage your account</li>
      <li>To improve our services</li>
      <li>To communicate with you about your orders and updates</li>
    </ul>
    <h2 className="text-xl font-semibold mt-4 mb-2">Your Rights</h2>
    <ul className="list-disc ml-6 mb-2">
      <li>You can request access, correction, or deletion of your personal data</li>
      <li>You can opt out of marketing communications at any time</li>
    </ul>
    <p className="mt-4">For more details, contact us at support@lebaneseflames.co.uk.</p>
  </div>
);

export default PrivacyPolicy;
