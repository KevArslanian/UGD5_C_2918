import {
  AtSign,
  Building2,
  Clock3,
  Globe2,
  Link2,
  Mail,
  MapPin,
  MessageCircleMore,
  Phone,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type CompanyContactItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
};

export type CompanyFactItem = {
  label: string;
  value: string;
};

export const COMPANY_HERO_HEADLINE = "Tracking kargo udara yang cepat, padat, dan tetap tenang dibaca.";

export const COMPANY_HERO_COPY =
  "SkyHub membantu operator memantau AWB, flight board, manifest, dan audit log dalam satu sistem yang stabil, rapi, dan siap digunakan sepanjang shift operasional.";

export const COMPANY_ABOUT_COPY =
  "SkyHub menghadirkan sistem operasional cargo udara yang menyatukan monitoring shipment, manifest, flight board, dan audit log dalam antarmuka yang formal, stabil, dan mudah dibaca untuk kebutuhan harian control room.";

export const COMPANY_OPERATOR_NOTE =
  "Tampilan dibuat dengan fokus pada keterbacaan cepat, struktur yang stabil, dan navigasi yang mudah dipahami untuk kebutuhan operasional harian.";

export const COMPANY_FACTS: CompanyFactItem[] = [
  {
    label: "Industry",
    value: "Air Cargo Operations and Digital Logistics",
  },
  {
    label: "Services",
    value: "AWB Tracking, Flight Board, Manifest Monitoring, Audit and Alerts",
  },
  {
    label: "Coverage",
    value: "Domestic and International Cargo Coordination",
  },
  {
    label: "Status",
    value: "Enterprise Cargo Operations Platform",
  },
] as const;

export const COMPANY_CONTACT_ITEMS: CompanyContactItem[] = [
  {
    icon: Building2,
    label: "Office",
    value: "SkyHub Operations Center",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Jl. Kargo Internasional No. 12, Area Logistik Bandara, Jakarta 15126, Indonesia",
  },
  {
    icon: Mail,
    label: "General Email",
    value: "info@skyhub.co",
    href: "mailto:info@skyhub.co",
  },
  {
    icon: Mail,
    label: "Operations Email",
    value: "ops@skyhub.co",
    href: "mailto:ops@skyhub.co",
  },
  {
    icon: Mail,
    label: "Support Email",
    value: "support@skyhub.co",
    href: "mailto:support@skyhub.co",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+62 21 500 780",
    href: "tel:+6221500780",
  },
  {
    icon: Smartphone,
    label: "Mobile Ops",
    value: "+62 812 9000 1122",
    href: "tel:+6281290001122",
  },
  {
    icon: MessageCircleMore,
    label: "WhatsApp Business",
    value: "+62 812 9000 3344",
    href: "https://wa.me/6281290003344",
  },
  {
    icon: Globe2,
    label: "Website",
    value: "www.skyhub.co",
    href: "https://www.skyhub.co",
  },
  {
    icon: Clock3,
    label: "Working Hours",
    value: "Senin sampai Jumat, 08.00 sampai 20.00 WIB",
  },
  {
    icon: ShieldCheck,
    label: "Emergency Ops Line",
    value: "24 jam monitoring support",
  },
  {
    icon: AtSign,
    label: "Instagram",
    value: "@skyhub.official",
    href: "https://instagram.com/skyhub.official",
  },
  {
    icon: Link2,
    label: "LinkedIn",
    value: "SkyHub Cargo Systems",
    href: "https://www.linkedin.com",
  },
] as const;

export const COMPANY_CONTACT_TEASER = [
  COMPANY_CONTACT_ITEMS[0],
  COMPANY_CONTACT_ITEMS[3],
  COMPANY_CONTACT_ITEMS[5],
  COMPANY_CONTACT_ITEMS[7],
] as const;
