import { motion } from "framer-motion";
import {
  Camera,
  Cpu,
  FileText,
  Clock,
  MapPin,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Camera,
      titleKey: 'featPhotoUpload',
      descKey: 'featPhotoUploadDesc',
      color: "bg-primary",
      lightBg: "bg-primary/5",
    },
    {
      icon: Cpu,
      titleKey: 'featAIAnalysis',
      descKey: 'featAIAnalysisDesc',
      color: "bg-secondary",
      lightBg: "bg-secondary/5",
    },
    {
      icon: FileText,
      titleKey: 'featReport',
      descKey: 'featReportDesc',
      color: "bg-accent",
      lightBg: "bg-accent/8",
    },
    {
      icon: Clock,
      titleKey: 'featInstantResult',
      descKey: 'featInstantResultDesc',
      color: "bg-primary",
      lightBg: "bg-primary/5",
    },
    {
      icon: MapPin,
      titleKey: 'featLocationBased',
      descKey: 'featLocationBasedDesc',
      color: "bg-secondary",
      lightBg: "bg-secondary/5",
    },
    {
      icon: Shield,
      titleKey: 'featExpertAdvice',
      descKey: 'featExpertAdviceDesc',
      color: "bg-primary",
      lightBg: "bg-primary/5",
    },
    {
      icon: Smartphone,
      titleKey: 'featOfflineSupport',
      descKey: 'featOfflineSupportDesc',
      color: "bg-accent",
      lightBg: "bg-accent/8",
    },
    {
      icon: Users,
      titleKey: 'featExpertContact',
      descKey: 'featExpertContactDesc',
      color: "bg-secondary",
      lightBg: "bg-secondary/5",
    },
  ];

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t('featuresSubheading')}{" "}
            <span className="text-gradient">{t('featuresHeading')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {t('featuresTagline')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group"
            >
              <div className={`${feature.lightBg} rounded-2xl p-5 sm:p-6 h-full border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-md`}>
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
