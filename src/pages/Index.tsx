import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import QuickActionsGrid from "@/components/home/QuickActionsGrid";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { MyMarketShortcut } from "@/components/home/MyMarketShortcut";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Kisan Sathi | AI-Powered Farming Assistant for Indian Farmers</title>
        <meta
          name="description"
          content="Kisan Sathi helps Indian farmers with AI-powered crop disease detection, weather advisories, mandi prices, and personalized farming recommendations in Hindi."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <QuickActionsGrid />
          
          {/* My Market Shortcut - placed after quick actions */}
          <section className="py-4 sm:py-6">
            <div className="container mx-auto px-4 max-w-xl">
              <MyMarketShortcut />
            </div>
          </section>
          
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
