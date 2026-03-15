import { useSections } from "@/hooks/useSections";

export const DynamicSections = () => {
  const { sections } = useSections();
  if (!sections.length) return null;
  return (
    <>
      {sections.map(section => (
        <section key={section.id} className="py-12 md:py-16 bg-background">
          <div className="container">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              {section.title}
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground font-body">
              {section.content}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};
