import { LocationLanding } from "@/components/templates/LocationLanding";

const data = {
  morelos: { city: "Morelos", region: "Morelos", postalCode: "62000", address: "Cuernavaca, Morelos", phone: "+52-1-555-000-0000", intro: "Operamos desde el corazón de Morelos atendiendo industria farmacéutica, parques industriales, instituciones educativas y gobiernos municipales.", industries: ["Industria farmacéutica", "Parques industriales (CIVAC)", "Gobierno estatal y municipal", "Sector educativo", "Hospitalidad y turismo"] },
  cuernavaca: { city: "Cuernavaca", region: "Morelos", postalCode: "62000", address: "Cuernavaca, Morelos", phone: "+52-1-555-000-0000", intro: "Consultoría premium en seguridad institucional para corporativos, dependencias y proyectos de inversión en la capital morelense.", industries: ["Corporativos", "Dependencias de gobierno", "Sector salud", "Educación privada"] },
  jiutepec: { city: "Jiutepec", region: "Morelos", postalCode: "62550", address: "Jiutepec, Morelos", phone: "+52-1-555-000-0000", intro: "Atención especializada para la zona industrial de Jiutepec y empresas operando en CIVAC.", industries: ["Manufactura", "Logística", "Química y farmacéutica", "Automotriz"] },
  civac: { city: "CIVAC", region: "Morelos", postalCode: "62578", address: "Ciudad Industrial del Valle de Cuernavaca", phone: "+52-1-555-000-0000", intro: "Servicios STPS, protección civil y videovigilancia IA para plantas industriales del corredor CIVAC.", industries: ["Automotriz", "Manufactura pesada", "Logística", "Industria de transformación"] },
  monterrey: { city: "Monterrey", region: "Nuevo León", postalCode: "64000", address: "Monterrey, Nuevo León", phone: "+52-1-555-000-0000", intro: "Consultoría de seguridad para corporativos, nearshoring y manufactura avanzada en el clúster regiomontano.", industries: ["Manufactura avanzada", "Nearshoring", "Acero y metalmecánica", "Corporativos globales"] },
  queretaro: { city: "Querétaro", region: "Querétaro", postalCode: "76000", address: "Querétaro, Qro.", phone: "+52-1-555-000-0000", intro: "Soluciones de seguridad institucional para el polo aeroespacial, automotriz y tecnológico de Querétaro.", industries: ["Aeroespacial", "Automotriz", "Tecnología y data centers", "Logística"] },
  guadalajara: { city: "Guadalajara", region: "Jalisco", postalCode: "44100", address: "Guadalajara, Jal.", phone: "+52-1-555-000-0000", intro: "Atendemos el ecosistema tecnológico, manufacturero y de servicios del Valle del Silicio Mexicano.", industries: ["Tecnología y software", "Electrónica", "Manufactura", "Servicios financieros"] },
};

export function MakeLocation(slug: keyof typeof data) {
  const d = data[slug];
  return () => <LocationLanding slug={slug} {...d} />;
}

export const Morelos = MakeLocation("morelos");
export const Cuernavaca = MakeLocation("cuernavaca");
export const Jiutepec = MakeLocation("jiutepec");
export const Civac = MakeLocation("civac");
export const Monterrey = MakeLocation("monterrey");
export const Queretaro = MakeLocation("queretaro");
export const Guadalajara = MakeLocation("guadalajara");
