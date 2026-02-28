import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AboutChef } from "@/components/AboutChef";
import { Award, Users, Clock, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
        <div className="container text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Story
          </h1>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            From the heart of Beirut to the streets of Eltham, bringing authentic 
            Lebanese flavours to South East London
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 bg-flame/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-flame" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Made with Love</h3>
              <p className="text-sm text-muted-foreground font-body">
                Every dish prepared with passion and care
              </p>
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 bg-olive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-7 h-7 text-olive" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">5★ Hygiene</h3>
              <p className="text-sm text-muted-foreground font-body">
                Top food safety rating from local council
              </p>
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Fresh Daily</h3>
              <p className="text-sm text-muted-foreground font-body">
                Ingredients prepared fresh every morning
              </p>
            </div>
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">Family Run</h3>
              <p className="text-sm text-muted-foreground font-body">
                Three generations of culinary heritage
              </p>
            </div>
          </div>
        </div>
      </section>

      <AboutChef />

      {/* Story Section */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">
              Why Lebanese Flames?
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground font-body">
              <p className="mb-4">
                When we opened our doors in Eltham, we had one simple mission: to share the 
                incredible flavours of Lebanon with our local community. The name "Flames" 
                represents the passion that goes into every dish – from the char-grilled 
                perfection of our kebabs to the warm hospitality we extend to every customer.
              </p>
              <p>
                We source the finest ingredients, prepare everything fresh daily, and stay 
                true to the recipes that have been passed down through our family for generations. 
                Whether you're craving a quick shawarma wrap or a full mezze feast, we promise 
                an authentic taste of Lebanon, delivered with love.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
