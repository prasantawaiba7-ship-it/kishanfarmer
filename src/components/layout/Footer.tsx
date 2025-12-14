import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-background">CROPIC</span>
            </Link>
            <p className="text-background/70 max-w-sm leading-relaxed">
              AI-powered crop monitoring and insurance claim support system
              integrated with PMFBY for Indian farmers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-background">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/farmer"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Farmer Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/authority"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Authority Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-background">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://pmfby.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  PMFBY Portal
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  User Guide
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            © 2024 CROPIC. Part of Digital Agriculture Mission, Government of India.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-background/60 hover:text-background">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-background/60 hover:text-background">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
