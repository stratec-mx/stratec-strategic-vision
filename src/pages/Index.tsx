import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { InstitutionalSupport } from "@/components/sections/InstitutionalSupport";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content">
        <Hero />
        <About />
        <Services />
        <Sectors />
        <Methodology />
        <Technology />
        <Cases />
        <Advantages />
        <InstitutionalSupport />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
