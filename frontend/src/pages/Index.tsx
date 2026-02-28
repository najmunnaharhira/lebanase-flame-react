import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MenuHighlights } from "@/components/MenuHighlights";
import { AboutUs } from "@/components/AboutUs";
import { AboutChef } from "@/components/AboutChef";
import { Footer } from "@/components/Footer";
import { StickyCartBar } from "@/components/StickyCartBar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <Hero />

        <MenuHighlights />

        <AboutUs />
        <AboutChef />
      </main>

      <Footer />
      <StickyCartBar />
    </div>
  );
};

export default Index;
