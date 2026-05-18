import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Sectors } from "@/components/sections/Sectors";
import { Methodology } from "@/components/sections/Methodology";
import { Technology } from "@/components/sections/Technology";
import { Cases } from "@/components/sections/Cases";
import { Advantages } from "@/components/sections/Advantages";
import { CTA } from "@/components/sections/CTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Sectors />
        <Methodology />
        <Technology />
        <Cases />
        <Advantages />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
