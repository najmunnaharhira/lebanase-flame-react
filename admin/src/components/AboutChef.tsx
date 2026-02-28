import chefImage from "@/assets/chef-plating-dish-stockcake.webp";
import { Award, Heart, Utensils } from "lucide-react";

export const AboutChef = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={chefImage}
                alt="Chef Ahmad"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative badge */}
            <div className="absolute -bottom-4 -right-4 bg-flame text-primary-foreground p-4 rounded-2xl shadow-elevated">
              <span className="font-display font-bold text-2xl">20+</span>
              <span className="block text-sm font-body">Years Experience</span>
            </div>
          </div>

          {/* Content */}
          <div className="animate-fade-in">
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
              Meet Our Chef
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
              Chef Ahmad Khoury
            </h2>
            <p className="text-muted-foreground font-body text-lg mb-6 leading-relaxed">
              Born in Beirut and trained in the finest Lebanese kitchens, Chef Ahmad brings 
              over two decades of culinary expertise to Eltham. Every dish is crafted with 
              love, using traditional family recipes passed down through generations.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                <div className="bg-olive/20 p-2 rounded-lg">
                  <Heart className="w-5 h-5 text-olive" />
                </div>
                <div>
                  <h4 className="font-body font-semibold text-foreground">Made Fresh</h4>
                  <p className="text-sm text-muted-foreground">Daily preparation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                <div className="bg-flame/20 p-2 rounded-lg">
                  <Utensils className="w-5 h-5 text-flame" />
                </div>
                <div>
                  <h4 className="font-body font-semibold text-foreground">Authentic</h4>
                  <p className="text-sm text-muted-foreground">Family recipes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                <div className="bg-gold/20 p-2 rounded-lg">
                  <Award className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="font-body font-semibold text-foreground">5★ Rated</h4>
                  <p className="text-sm text-muted-foreground">Hygiene score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
