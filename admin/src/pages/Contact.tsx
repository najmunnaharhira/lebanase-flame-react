import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent!", {
      description: "We'll get back to you as soon as possible.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
        <div className="container text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-muted-foreground font-body text-lg max-w-md mx-auto">
            Have a question or feedback? We'd love to hear from you
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-body">
                      Name
                    </label>
                    <Input placeholder="Your name" className="h-12" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-body">
                      Email
                    </label>
                    <Input type="email" placeholder="your@email.com" className="h-12" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-body">
                    Phone (optional)
                  </label>
                  <Input type="tel" placeholder="07XXX XXX XXX" className="h-12" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-body">
                    Message
                  </label>
                  <Textarea 
                    placeholder="How can we help you?" 
                    className="min-h-[150px] resize-none" 
                    required 
                  />
                </div>
                <Button variant="flame" size="lg" type="submit">
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Get in Touch
              </h2>
              
              <div className="space-y-6">
                {/* Call Button */}
                <a
                  href="tel:02081234567"
                  className="flex items-center gap-4 p-5 bg-flame/10 hover:bg-flame/20 rounded-2xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-flame rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-foreground">Call us now</p>
                    <p className="text-lg font-display font-bold text-flame">020 8123 4567</p>
                  </div>
                </a>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-card rounded-xl shadow-card">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-body font-medium text-foreground">Email</p>
                      <a href="mailto:hello@lebaneseflames.co.uk" className="text-muted-foreground hover:text-primary transition-colors">
                        hello@lebaneseflames.co.uk
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-card rounded-xl shadow-card">
                    <MapPin className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-body font-medium text-foreground">Address</p>
                      <p className="text-muted-foreground">
                        123 High Street<br />
                        Eltham, London<br />
                        SE9 1XX
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-card rounded-xl shadow-card">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-body font-medium text-foreground">Opening Hours</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Mon - Thu: 11am - 10pm</p>
                        <p>Fri - Sat: 11am - 11pm</p>
                        <p>Sunday: 12pm - 9pm</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
