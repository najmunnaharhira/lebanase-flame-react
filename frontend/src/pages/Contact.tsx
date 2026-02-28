import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { useState } from "react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest("/support/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, orderId, message }),
      });
      toast.success("Message sent!", {
        description: "We'll get back to you as soon as possible.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setOrderId("");
      setMessage("");
    } catch (error) {
      toast.error("Unable to send message.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                    <Input
                      placeholder="Your name"
                      className="h-12"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 font-body">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-12"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-body">
                    Phone (optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="07466 305 669"
                    className="h-12"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-body">
                    Order ID (optional)
                  </label>
                  <Input
                    placeholder="e.g. 123456"
                    className="h-12"
                    value={orderId}
                    onChange={(event) => setOrderId(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-body">
                    Message
                  </label>
                  <Textarea 
                    placeholder="How can we help you?" 
                    className="min-h-[150px] resize-none" 
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                  />
                </div>
                <Button variant="flame" size="lg" type="submit" disabled={isSubmitting}>
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
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
                <div className="grid gap-4">
                  <a
                    href="tel:+447466305669"
                    className="flex items-center gap-4 p-5 bg-flame/10 hover:bg-flame/20 rounded-2xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-flame rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-foreground">Call us now</p>
                      <p className="text-lg font-display font-bold text-flame">+44 7466 305 669</p>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/447466305669"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-2xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-foreground">WhatsApp support</p>
                      <p className="text-sm text-muted-foreground">Fast replies for delivery updates</p>
                    </div>
                  </a>
                </div>

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
                        381 Footscray Road<br />
                        New Eltham, London<br />
                        SE9 2DR
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-card rounded-xl shadow-card">
                    <Clock className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-body font-medium text-foreground">Opening Hours</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Monday to Sunday: 12:00pm - 11:00pm</p>
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
