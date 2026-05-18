import { motion } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface Section { title: string; body: string | string[]; }

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: Section[];
}

export const LegalLayout = ({ eyebrow, title, intro, updated, sections }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="eyebrow mb-6">— {eyebrow}</div>
            <h1 className="font-display text-4xl md:text-6xl font-light text-navy leading-[1.05] text-balance">{title}</h1>
            <p className="mt-8 text-lg text-steel max-w-3xl font-light leading-relaxed">{intro}</p>
            <div className="mt-6 text-xs uppercase tracking-[0.3em] text-steel/60">Última actualización: {updated}</div>
          </motion.div>

          <div className="mt-16 grid lg:grid-cols-12 gap-12">
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32 border-l border-border pl-6">
                <div className="text-xs uppercase tracking-[0.3em] text-olive mb-4">Índice</div>
                <ol className="space-y-3 text-sm text-steel">
                  {sections.map((s, i) => (
                    <li key={s.title}>
                      <a href={`#sec-${i + 1}`} className="hover:text-navy transition-colors">
                        <span className="font-mono-ibm text-[10px] text-steel/50 mr-2">{String(i + 1).padStart(2, "0")}</span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            <article className="lg:col-span-9 space-y-14">
              {sections.map((s, i) => (
                <motion.div
                  key={s.title} id={`sec-${i + 1}`}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5 }}
                  className="border-t border-border pt-10"
                >
                  <div className="font-mono-ibm text-xs text-olive mb-3">{String(i + 1).padStart(2, "0")}</div>
                  <h2 className="font-display text-2xl md:text-3xl text-navy font-light mb-5">{s.title}</h2>
                  {Array.isArray(s.body) ? (
                    <ul className="space-y-3 text-steel font-light leading-relaxed">
                      {s.body.map((b, j) => (
                        <li key={j} className="flex gap-4">
                          <span className="text-olive mt-2 h-px w-4 bg-olive shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-steel font-light leading-relaxed whitespace-pre-line">{s.body}</p>
                  )}
                </motion.div>
              ))}
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
