import { Button } from "@/components/ui/button";
import { MapPin, Phone } from "lucide-react";
import { useBusinessName } from "@/hooks/useBusinessName";

export const Locations = () => {
  const businessName = useBusinessName();

  return (
    <section className="py-12 md:py-16 bg-muted">
      <div className="container">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
              Locations
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground mt-2 mb-4">
              Visit {businessName}
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium text-foreground">Eltham / SE9</p>
                  <p>381 Footscray Road, New Eltham, London SE9 2DR</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium text-foreground">07466 305 669</p>
                  <p>Call to order or for allergy info</p>
                </div>
              </div>
              <p>Open daily: 12:00pm – 11:00pm</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="flame" asChild>
                <a href="https://maps.google.com/?q=381%20Footscray%20Road,%20New%20Eltham,%20London%20SE9%202DR" target="_blank" rel="noreferrer">
                  Get directions
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="tel:07466305669">Call now</a>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-card">
            <iframe
              title={`${businessName} location`}
              src="https://maps.google.com/maps?q=381%20Footscray%20Road,%20New%20Eltham,%20London%20SE9%202DR&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-[320px] md:h-[400px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
