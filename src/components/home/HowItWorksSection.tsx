import { motion } from "framer-motion";
import { UserPlus, Camera, Cpu, FileCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register & Enroll",
    description:
      "Farmers register using mobile OTP or eKYC. Link your plots with PMFBY enrollment data for seamless verification.",
  },
  {
    icon: Camera,
    step: "02",
    title: "Capture Crop Photos",
    description:
      "Follow guided instructions to take photos at 4-5 crop stages. GPS and timestamp are automatically recorded.",
  },
  {
    icon: Cpu,
    step: "03",
    title: "AI Analysis",
    description:
      "Our ML models analyze images for crop type, growth stage, and detect stress, disease, or damage conditions.",
  },
  {
    icon: FileCheck,
    step: "04",
    title: "Claim Support",
    description:
      "Verified photo evidence supports faster claim processing. Authorities get real-time damage reports.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How CROPIC Works
          </h2>
          <p className="text-lg text-muted-foreground">
            A simple 4-step process from enrollment to claim support, designed
            for accessibility in rural areas.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Step Number */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center shadow-lg">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
