import { motion } from "framer-motion";
import { Camera, Cpu, FileCheck, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const HowItWorksSection = () => {
  const { t, language } = useLanguage();

  const steps = [
    {
      number: language === 'ne' ? "१" : "1",
      icon: Camera,
      titleKey: 'howStep1Title',
      descKey: 'howStep1Desc',
      tipKey: 'howStep1Tip',
      color: "bg-primary",
    },
    {
      number: language === 'ne' ? "२" : "2",
      icon: Cpu,
      titleKey: 'howStep2Title',
      descKey: 'howStep2Desc',
      tipKey: 'howStep2Tip',
      color: "bg-primary",
    },
    {
      number: language === 'ne' ? "३" : "3",
      icon: FileCheck,
      titleKey: 'howStep3Title',
      descKey: 'howStep3Desc',
      tipKey: 'howStep3Tip',
      color: "bg-secondary",
    },
  ];

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('howItWorksTitle')} <span className="text-gradient">{t('howItWorksHighlight')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {t('howItWorksSubtitle')}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-14 left-full w-6 items-center justify-center z-10 -ml-3">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                
                <div className="bg-card rounded-2xl p-6 sm:p-7 h-full border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg relative">
                  <div className={`absolute -top-3 -left-1 w-10 h-10 rounded-xl ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {step.number}
                  </div>
                  
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5 mt-3">
                    <step.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                  
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs sm:text-sm font-medium">
                    {t(step.tipKey)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10 sm:mt-14"
        >
          <Link to="/disease-detection">
            <Button size="lg" className="group rounded-full px-8 py-6 text-base sm:text-lg font-semibold shadow-lg">
              <Camera className="w-5 h-5 mr-2" />
              {t('tryNow')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
