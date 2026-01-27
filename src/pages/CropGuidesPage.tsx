import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CropGuidesViewer } from '@/components/guides/CropGuidesViewer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const CropGuidesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine where user came from for back navigation
  const handleBackClick = () => {
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <Helmet>
        <title>खेती गाइड - Crop Guides | Kisan Sathi</title>
        <meta name="description" content="नेपालमा विभिन्न बालीहरूको पूर्ण खेती गाइड - माटो तयारी, बिउ रोपाइँ, मल व्यवस्थापन, सिँचाइ, रोग नियन्त्रण, कटानी र भण्डारण।" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-32">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Back Navigation - Always visible at top */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              className="-ml-2 mb-4 h-10 px-3 touch-manipulation"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              फिर्ता जानुहोस्
            </Button>
            
            <CropGuidesViewer />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CropGuidesPage;
