import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useBusinessName } from "@/hooks/useBusinessName";

export const Footer = () => {
  const businessName = useBusinessName();

  return (
    <footer className="bg-charcoal text-cream">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold text-cream mb-4">
              {businessName}
            </h3>
            <p className="text-cream/70 font-body text-sm mb-4">
              We’re about authenticity, with expert staff cooking up mouthwatering Lebanese delicacies for Eltham and SE9.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-cream/10 rounded-full flex items-center justify-center hover:bg-cream/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-cream/10 rounded-full flex items-center justify-center hover:bg-cream/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-cream mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/menu" className="text-cream/70 hover:text-cream transition-colors font-body text-sm">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-cream/70 hover:text-cream transition-colors font-body text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-cream/70 hover:text-cream transition-colors font-body text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold text-cream mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-cream/70 text-sm">
                <Phone className="w-4 h-4 text-flame" />
                <a href="tel:07466305669" className="hover:text-cream transition-colors">
                  07466 305 669
                </a>
              </li>
              <li className="flex items-center gap-3 text-cream/70 text-sm">
                <Mail className="w-4 h-4 text-flame" />
                <a href="mailto:hello@lebaneseflames.co.uk" className="hover:text-cream transition-colors">
                  hello@lebaneseflames.co.uk
                </a>
              </li>
              <li className="flex items-start gap-3 text-cream/70 text-sm">
                <MapPin className="w-4 h-4 text-flame shrink-0 mt-0.5" />
                <span>381 Footscray Road, New Eltham, London SE9 2DR</span>
              </li>
              <li className="text-cream/70 text-xs">
                All major credit/debit cards accepted. Terms & conditions apply.
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="font-body font-semibold text-cream mb-4">Opening Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3 text-cream/70">
                <Clock className="w-4 h-4 text-flame" />
                <div>
                  <span className="block">Monday to Sunday: 12:00pm - 11:00pm</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-cream/70">
                <Clock className="w-4 h-4 text-flame" />
                <div>
                  <span className="block">Friday: 2:00pm - 11:00pm</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Map */}
        <div className="mt-10">
          <h4 className="font-body font-semibold text-cream mb-4">Find us</h4>
          <div className="overflow-hidden rounded-2xl border border-cream/10">
            <iframe
              title={`${businessName} location`}
              src="https://www.google.com/maps?q=381%20Footscray%20Road,%20New%20Eltham,%20London%20SE9%202DR&output=embed"
              className="w-full h-64 md:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=381%20Footscray%20Road,%20New%20Eltham,%20London%20SE9%202DR"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-cream/70 hover:text-cream transition-colors mt-3"
          >
            Get directions on Google Maps
          </a>
        </div>

        {/* Bottom */}
        <div className="border-t border-cream/10 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream/50 text-sm font-body">
            © 2026 Lebanese Flames. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-cream/50 hover:text-cream text-sm font-body transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="text-cream/50 hover:text-cream text-sm font-body transition-colors">
              Terms & Conditions
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-cream/50">
            {/* <span className="rounded-full border border-cream/20 px-2 py-1">Food Hygiene: 5 - Very Good</span> */}
            <span className="rounded-full border border-cream/20 px-2 py-1">Secure & Trusted</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
