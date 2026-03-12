import React from "react";

const TermsAndConditions: React.FC = () => (
  <div className="container mx-auto p-6 max-w-3xl">
    <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
    <p className="mb-2">By using our services, you agree to the following terms and conditions. Please read them carefully.</p>
    <h2 className="text-xl font-semibold mt-4 mb-2">Ordering</h2>
    <ul className="list-disc ml-6 mb-2">
      <li>All orders are subject to acceptance and availability.</li>
      <li>Prices and menu items may change without notice.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-4 mb-2">Payments</h2>
    <ul className="list-disc ml-6 mb-2">
      <li>Payments must be made in full at the time of order.</li>
      <li>We accept various payment methods as listed on our website.</li>
    </ul>
    <h2 className="text-xl font-semibold mt-4 mb-2">Liability</h2>
    <ul className="list-disc ml-6 mb-2">
      <li>We are not liable for any indirect or consequential loss.</li>
      <li>Our liability is limited to the value of your order.</li>
    </ul>
    <p className="mt-4">For questions, contact us at support@lebaneseflames.co.uk.</p>
  </div>
);

export default TermsAndConditions;
