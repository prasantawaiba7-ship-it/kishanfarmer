import { Button } from "@/components/ui/button";
import { Camera, BarChart3, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-fields.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grain pointer-events-none" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Camera className="w-4 h-4" />
              Real-time Crop Monitoring
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Smart Crop Insurance with{" "}
              <span className="text-primary">AI-Powered</span> Assessment
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              CROPIC revolutionizes agricultural insurance through real-time photo
              documentation, AI-based crop analysis, and seamless integration with
              PMFBY workflows. Protect your harvest with technology.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/farmer">
                <Button size="xl" variant="hero">
                  Start Monitoring
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/authority">
                <Button size="xl" variant="outline">
                  Authority Portal
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "10M+", label: "Farmers Served" },
                { value: "95%", label: "Claim Accuracy" },
                { value: "24hrs", label: "Avg. Processing" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main Card */}
              <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl overflow-hidden">
                <img
                  src={heroImage}
                  alt="Lush green paddy fields at golden hour"
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex items-end p-6">
                  <div className="w-full bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center">
                        <Shield className="w-5 h-5 text-success-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Crop Health</div>
                        <div className="text-sm text-success">Healthy - No Issues</div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-success rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-4 bg-card rounded-xl p-4 shadow-lg border border-border"
              >
                <BarChart3 className="w-8 h-8 text-accent mb-2" />
                <div className="text-sm font-medium text-foreground">AI Analysis</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-4 bg-card rounded-xl p-4 shadow-lg border border-border"
              >
                <Camera className="w-8 h-8 text-secondary mb-2" />
                <div className="text-sm font-medium text-foreground">Photo Capture</div>
                <div className="text-xs text-muted-foreground">GPS Verified</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
