import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CropGuidesViewer } from '@/components/guides/CropGuidesViewer';

const CropGuidesPage = () => {
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
            <CropGuidesViewer />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CropGuidesPage;
