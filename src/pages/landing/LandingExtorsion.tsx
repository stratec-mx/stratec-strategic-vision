// /extorsion — landing de captación para PyMEs de Morelos. Textos en src/data/landings.ts.
import { LandingPage } from "@/components/landing/LandingPage";
import { LANDINGS } from "@/data/landings";

export default function LandingExtorsion() {
  return <LandingPage data={LANDINGS.extorsion} />;
}
