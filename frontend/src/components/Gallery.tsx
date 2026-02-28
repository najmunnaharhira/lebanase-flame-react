import heroImage from "@/assets/hero-food.jpg";
import shawarmaImg from "@/assets/shawarma.jpg";

const galleryImages = [
  { src: heroImage, alt: "Lebanese mezze spread" },
  { src: shawarmaImg, alt: "Shawarma platter" },
  { src: heroImage, alt: "Lebanese grill selection" },
  { src: shawarmaImg, alt: "Fresh wraps and sides" },
  { src: heroImage, alt: "House mezze selection" },
];

export const Gallery = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
              Gallery
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              Food you can almost taste
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={image.alt}
              className={`overflow-hidden rounded-2xl shadow-soft ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
