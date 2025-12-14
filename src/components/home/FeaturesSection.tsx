import { motion } from "framer-motion";
import {
  Camera,
  Cpu,
  Map,
  Clock,
  Shield,
  Users,
  Smartphone,
  Cloud,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Guided Photo Capture",
    description:
      "Step-by-step instructions for capturing crop photos at the right angles with GPS verification.",
    color: "bg-primary",
  },
  {
    icon: Cpu,
    title: "AI-Powered Analysis",
    description:
      "Advanced machine learning models detect crop type, growth stage, and stress/damage conditions.",
    color: "bg-secondary",
  },
  {
    icon: Map,
    title: "Geo-Tagged Evidence",
    description:
      "Every photo is linked to plot coordinates and verified against PMFBY enrollment data.",
    color: "bg-accent",
  },
  {
    icon: Clock,
    title: "Real-Time Processing",
    description:
      "Get instant feedback on crop health status and damage assessment within seconds.",
    color: "bg-success",
  },
  {
    icon: Shield,
    title: "Secure & Tamper-Proof",
    description:
      "Blockchain-ready timestamps and encrypted storage ensure data integrity for claims.",
    color: "bg-primary",
  },
  {
    icon: Users,
    title: "Multi-Stakeholder Access",
    description:
      "Separate portals for farmers, field officials, insurers, and government authorities.",
    color: "bg-secondary",
  },
  {
    icon: Smartphone,
    title: "Offline-First Design",
    description:
      "Capture photos without internet; data syncs automatically when connected.",
    color: "bg-accent",
  },
  {
    icon: Cloud,
    title: "YES-TECH Integration",
    description:
      "Seamlessly connects with satellite data and yield estimation systems for comprehensive analysis.",
    color: "bg-success",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30 relative">
      <div className="absolute inset-0 bg-grain pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Crop Monitoring
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive platform designed for farmers, field officials, and
            insurance authorities to streamline crop assessment and claims.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-border hover:border-primary/20"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
