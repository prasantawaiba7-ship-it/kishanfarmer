import { Leaf, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-card text-foreground border-t border-border/50 py-14">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">{t('kisanSathi')}</span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
              {t('footerDescription')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('platform')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/farmer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('farmerPortal')}
                </Link>
              </li>
              <li>
                <Link to="/market" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('krishiBazar')}
                </Link>
              </li>
              <li>
                <Link to="/krishi-mitra" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('kisanSathiAI')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('resources')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/disease-detection" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('diseaseDetection')}
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('userGuide')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {t('contactSupport')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <p className="text-sm text-muted-foreground">
              {t('copyright')}
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                {t('privacyPolicy')}
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                {t('termsOfService')}
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <Heart className="w-4 h-4 text-destructive fill-current" />
            <span className="font-medium text-foreground/70">Pragati Tech</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
