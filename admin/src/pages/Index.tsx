import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PromoBanner } from "@/components/PromoBanner";
import { LoyaltyBadge } from "@/components/LoyaltyBadge";
import { MenuHighlights } from "@/components/MenuHighlights";
import { AboutUs } from "@/components/AboutUs";
import { AppPromo } from "@/components/AppPromo";
import { Gallery } from "@/components/Gallery";
import { Locations } from "@/components/Locations";
import { Footer } from "@/components/Footer";
import { StickyCartBar } from "@/components/StickyCartBar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PromoBanner />
      
      <main>
        <Hero />
        
        <section className="py-8 md:py-12 bg-background">
          <div className="container">
            <LoyaltyBadge />
          </div>
        </section>

        <MenuHighlights />
        
        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container">
            <div className="bg-gradient-to-r from-primary to-charcoal rounded-3xl p-8 md:p-12 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-4">
                Ready to Order?
              </h2>
              <p className="text-cream/80 font-body text-lg mb-8 max-w-md mx-auto">
                Explore our full menu and enjoy authentic Lebanese flavours
              </p>
              <Button variant="gold" size="xl" asChild>
                <Link to="/menu">
                  View Full Menu
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <AboutUs />
        <AppPromo />
        <Gallery />
        <Locations />
      </main>

      <Footer />
      <StickyCartBar />
    </div>
  );
};

export default Index;
