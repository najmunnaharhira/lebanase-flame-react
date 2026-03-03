import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";
import { useBusinessName } from "@/hooks/useBusinessName";

export const AppPromo = () => {
  const businessName = useBusinessName();

  return (
    <section className="py-12 md:py-16 bg-muted">
      <div className="container">
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-card flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
              A new way to order
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Order {businessName} on your phone
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Save your favourites, reorder in seconds, and track every delivery. The
              {` ${businessName} experience is built for UK mobile ordering.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="flame">
              <Smartphone className="w-4 h-4" />
              Download iOS
            </Button>
            <Button variant="outline">
              <Smartphone className="w-4 h-4" />
              Download Android
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
