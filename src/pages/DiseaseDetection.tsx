import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NepaliDiseaseDetector } from '@/components/ai/NepaliDiseaseDetector';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';
import { OutbreakAlertsBanner } from '@/components/disease/OutbreakAlertsBanner';
import { DiseasePrediction } from '@/components/disease/DiseasePrediction';
import { DiagnosisCaseSubmit } from '@/components/diagnosis/DiagnosisCaseSubmit';
import { MyDiagnosisCases } from '@/components/diagnosis/MyDiagnosisCases';
import { PreventionTipsSection } from '@/components/disease/PreventionTipsSection';
import { DiseaseGuideTab } from '@/components/disease/DiseaseGuideTab';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Camera, BookOpen, UserCheck, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SectionKey = 'ai' | 'guide' | 'expert' | 'prevention';

export default function DiseaseDetection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [openSection, setOpenSection] = useState<SectionKey>('ai');

  const sections: { key: SectionKey; icon: React.ReactNode; label: string; color: string }[] = [
    {
      key: 'ai',
      icon: <Camera className="w-5 h-5" />,
      label: t('aiInstantCheck'),
      color: 'from-primary/15 to-primary/5 border-primary/30',
    },
    {
      key: 'guide',
      icon: <BookOpen className="w-5 h-5" />,
      label: language === 'ne' ? 'रोग गाइड' : 'Disease Guide',
      color: 'from-accent/15 to-accent/5 border-accent/30',
    },
    {
      key: 'expert',
      icon: <UserCheck className="w-5 h-5" />,
      label: t('askExpert'),
      color: 'from-secondary/15 to-secondary/5 border-secondary/30',
    },
    {
      key: 'prevention',
      icon: <ShieldCheck className="w-5 h-5" />,
      label: t('preventionTips') || 'रोकथाम',
      color: 'from-warning/15 to-warning/5 border-warning/30',
    },
  ];

  const toggleSection = (key: SectionKey) => {
    setOpenSection(prev => prev === key ? key : key);
  };

  const steps = [
    { step: '१', title: t('stepSelectCrop'), desc: t('stepCropType') },
    { step: '२', title: t('stepTakePhoto'), desc: t('stepDiseased') },
    { step: '३', title: t('stepUpload'), desc: t('stepUploadPhoto') },
    { step: '४', title: t('stepAnalysis'), desc: t('stepAICheck') },
    { step: '५', title: t('stepTreatment'), desc: t('stepGetAdvice') },
  ];

  return (
    <>
      <Helmet>
        <title>{t('diseasePageTitle')} | Kisan Sathi</title>
        <meta name="description" content={t('diseasePageSubtitle')} />
      </Helmet>

      <div className="min-h-screen bg-background overflow-y-auto">
        <Header />
        
        <main className="container mx-auto px-4 pt-20 pb-32 max-w-4xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              🌿 {t('diseasePageTitle')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              {t('diseasePageSubtitle')}
            </p>
          </div>

          <OutbreakAlertsBanner />

          {/* Accordion-style sections */}
          <div className="space-y-3 mt-4">
            {sections.map((section) => {
              const isOpen = openSection === section.key;
              return (
                <div key={section.key} className="rounded-2xl border overflow-hidden shadow-sm">
                  {/* Section header button */}
                  <button
                    onClick={() => toggleSection(section.key)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r ${section.color} transition-all active:scale-[0.99]`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                        {section.icon}
                      </div>
                      <span className="font-semibold text-sm sm:text-base text-foreground">
                        {section.label}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Section content */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-card">
                          {section.key === 'ai' && (
                            <div className="space-y-6">
                              <NepaliDiseaseDetector />
                              {user && <DiseasePrediction />}
                            </div>
                          )}
                          {section.key === 'guide' && <DiseaseGuideTab />}
                          {section.key === 'expert' && (
                            <div className="space-y-6">
                              <DiagnosisCaseSubmit />
                              {user && <MyDiagnosisCases />}
                            </div>
                          )}
                          {section.key === 'prevention' && <PreventionTipsSection />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* How to use section */}
          <div className="mt-10 p-4 sm:p-6 bg-muted/50 rounded-2xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              {t('howToUse')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
              {steps.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-xs sm:text-sm mb-0.5">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-warning/10 rounded-xl border border-warning/20">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                {t('photoTipsTitle')}
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>{t('photoTip1')}</li>
                <li>{t('photoTip2')}</li>
              </ul>
            </div>
          </div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}
