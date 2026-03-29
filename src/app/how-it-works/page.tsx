import { CoercionSection } from "@/components/how-it-works/coercion-section";
import { FaqSection } from "@/components/how-it-works/faq-section";
import { HeroSection } from "@/components/how-it-works/hero-section";
import { RealtimeSection } from "@/components/how-it-works/realtime-section";
import { SecuritySection } from "@/components/how-it-works/security-section";
import { TransparencySection } from "@/components/how-it-works/transparency-section";
import { VisionSection } from "@/components/how-it-works/vision-section";
import { VoteStepsSection } from "@/components/how-it-works/vote-steps-section";
import { WhyOnlineSection } from "@/components/how-it-works/why-online-section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function HowItWorksPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Comment ça marche" },
        ]}
      />

      <HeroSection />
      <WhyOnlineSection />
      <VoteStepsSection />
      <SecuritySection />
      <TransparencySection />
      <RealtimeSection />
      <CoercionSection />
      <VisionSection />
      <FaqSection />
    </>
  );
}
