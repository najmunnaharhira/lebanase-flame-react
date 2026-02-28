import chefImage from "@/assets/hero-food.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const AboutUs = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
              About Us
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Welcome to Lebanese Flames
            </h2>
            <p className="text-muted-foreground font-body text-lg leading-relaxed mb-6">
              Proudly serving Eltham and SE9, we bring authentic Lebanese cooking to your
              table with family recipes, fresh ingredients, and a warm neighbourhood feel.
              From mezze to charcoal grills, every dish is prepared with care and served fast.
            </p>
            <p className="text-muted-foreground font-body mb-6">
              Order with confidence — we’re sure you won’t be disappointed.
            </p>
            <Button variant="flame" asChild>
              <Link to="/menu">Start your order</Link>
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-card">
              <img
                src={chefImage}
                alt="Lebanese Flames kitchen"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-flame text-primary-foreground p-4 rounded-2xl shadow-elevated">
              <span className="font-display font-bold text-2xl">SE9</span>
              <span className="block text-sm font-body">Local favourites</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
