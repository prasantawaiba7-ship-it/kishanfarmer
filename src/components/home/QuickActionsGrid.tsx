import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Cloud, Mountain, Store, Bot } from "lucide-react";

const quickActions = [
  {
    icon: Camera,
    label: "रोग पहिचान",
    sublabel: "फोटोले रोग पत्ता लगाउने",
    href: "/disease-detection",
    gradient: "from-red-500 to-orange-500",
    bgGradient: "from-red-500/15 to-orange-500/10",
  },
  {
    icon: Cloud,
    label: "मौसम",
    sublabel: "आजको मौसम हेर्ने",
    href: "/farmer",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/15 to-cyan-500/10",
  },
  {
    icon: Mountain,
    label: "खेत/बाली",
    sublabel: "मेरो खेत व्यवस्थापन",
    href: "/fields",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/15 to-emerald-500/10",
  },
  {
    icon: Store,
    label: "बजार",
    sublabel: "भाउ र बिक्री",
    href: "/market",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/15 to-pink-500/10",
  },
  {
    icon: Bot,
    label: "AI सहायक",
    sublabel: "कृषि ज्ञान सोध्ने",
    href: "/krishi-mitra",
    gradient: "from-primary to-secondary",
    bgGradient: "from-primary/15 to-secondary/10",
  },
];

const QuickActionsGrid = () => {
  return (
    <section className="py-6 sm:py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            के गर्नुहुन्छ आज?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            तलको कार्ड छान्नुहोस्
          </p>
        </motion.div>

        {/* 2 columns on mobile, 3 on tablet, 5 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${action.bgGradient} border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer group`}
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform mx-auto`}
                  >
                    <action.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>

                  {/* Labels */}
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-bold text-foreground">
                      {action.label}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {action.sublabel}
                    </div>
                  </div>

                  {/* Decorative glow */}
                  <div
                    className={`absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br ${action.gradient} opacity-15 blur-2xl group-hover:opacity-25 transition-opacity`}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActionsGrid;
