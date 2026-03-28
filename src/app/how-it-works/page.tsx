import { CoercionSection } from "@/components/how-it-works/coercion-section";
import { FaqSection } from "@/components/how-it-works/faq-section";
import { HeroSection } from "@/components/how-it-works/hero-section";
import { RealtimeSection } from "@/components/how-it-works/realtime-section";
import { SecuritySection } from "@/components/how-it-works/security-section";
import { TransparencySection } from "@/components/how-it-works/transparency-section";
import { VisionSection } from "@/components/how-it-works/vision-section";
import { VoteStepsSection } from "@/components/how-it-works/vote-steps-section";
import { WhyOnlineSection } from "@/components/how-it-works/why-online-section";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function HowItWorksPage() {
  return (
    <>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Comment ça marche</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
