import { useState } from 'react';
import { useCrops, Crop } from '@/hooks/useCrops';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Check, 
  X, 
  RefreshCw, 
  AlertTriangle,
  Eye,
  Search
} from 'lucide-react';

export function CropPhotosManager() {
  const { crops, isLoading, updateCrop, refresh } = useCrops();
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCrop, setPreviewCrop] = useState<Crop | null>(null);

  const filteredCrops = crops.filter(
    (c) =>
      c.name_ne.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize crops by image status
  const needsReview = filteredCrops.filter(c => c.needs_image_review);
  const hasImage = filteredCrops.filter(c => c.image_url && !c.needs_image_review);
  const noImage = filteredCrops.filter(c => !c.image_url && !c.image_url_ai_suggested && !c.needs_image_review);

  const handleGenerateAIImage = async (crop: Crop) => {
    setGeneratingFor(crop.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-crop-image', {
        body: {
          crop_id: crop.id,
          crop_name_en: crop.name_en,
          crop_name_ne: crop.name_ne,
          category: crop.category
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success('AI फोटो बनाइयो! समीक्षा गर्नुहोस्।');
        await refresh();
      }
    } catch (err) {
      console.error('Generate image error:', err);
      toast.error('फोटो बनाउन सकिएन।');
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleUploadImage = async (crop: Crop, file: File) => {
    setUploadingFor(crop.id);
    try {
      const fileName = `admin-uploaded/${crop.id}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('crop-images')
        .getPublicUrl(fileName);

      // Update crop with uploaded image
      await updateCrop(crop.id, {
        image_url_uploaded: publicUrl,
        needs_image_review: true
      });

      toast.success('फोटो अपलोड भयो! समीक्षा गर्नुहोस्।');
      await refresh();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('अपलोड गर्न सकिएन।');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleApproveImage = async (crop: Crop, source: 'ai' | 'admin_upload') => {
    const imageUrl = source === 'ai' ? crop.image_url_ai_suggested : crop.image_url_uploaded;
    
    if (!imageUrl) {
      toast.error('फोटो उपलब्ध छैन।');
      return;
    }

    try {
      await updateCrop(crop.id, {
        image_url: imageUrl,
        image_source: source,
        needs_image_review: false
      });
      toast.success('फोटो स्वीकृत गरियो!');
      await refresh();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('स्वीकृत गर्न सकिएन।');
    }
  };

  const handleRemoveImage = async (crop: Crop) => {
    if (!confirm(`के तपाईं "${crop.name_ne}" को मुख्य फोटो हटाउन चाहनुहुन्छ?`)) return;
    
    try {
      await updateCrop(crop.id, {
        image_url: null,
        image_source: 'none',
        needs_image_review: true
      });
      toast.success('फोटो हटाइयो।');
      await refresh();
    } catch (err) {
      console.error('Remove error:', err);
      toast.error('हटाउन सकिएन।');
    }
  };

  const CropPhotoCard = ({ crop }: { crop: Crop }) => {
    const isGenerating = generatingFor === crop.id;
    const isUploading = uploadingFor === crop.id;

    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image Preview Section */}
          <div className="sm:w-40 aspect-square sm:aspect-auto bg-muted flex items-center justify-center relative">
            {crop.image_url ? (
              <img 
                src={crop.image_url} 
                alt={crop.name_ne}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <span className="text-xs text-muted-foreground">कुनै फोटो छैन</span>
              </div>
            )}
            {crop.needs_image_review && (
              <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground text-[10px]">
                <AlertTriangle className="h-3 w-3 mr-1" />
                समीक्षा
              </Badge>
            )}
          </div>

          {/* Info & Actions */}
          <CardContent className="flex-1 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-base">{crop.name_ne}</h3>
                <p className="text-sm text-muted-foreground">{crop.name_en}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {crop.category}
                </Badge>
              </div>
              <Badge variant={crop.image_source === 'none' ? 'secondary' : 'default'} className="text-[10px]">
                {crop.image_source === 'ai' && '🤖 AI'}
                {crop.image_source === 'admin_upload' && '📤 Uploaded'}
                {crop.image_source === 'external' && '🔗 External'}
                {crop.image_source === 'none' && '❓ None'}
              </Badge>
            </div>

            {/* Review Section - Show AI and Uploaded previews */}
            {crop.needs_image_review && (crop.image_url_ai_suggested || crop.image_url_uploaded) && (
              <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-2 text-muted-foreground">फोटो छान्नुहोस्:</p>
                <div className="flex gap-2 flex-wrap">
                  {crop.image_url_ai_suggested && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => { setPreviewImage(crop.image_url_ai_suggested); setPreviewCrop(crop); }}
                        className="relative w-16 h-16 rounded overflow-hidden border-2 hover:border-primary transition-colors"
                      >
                        <img src={crop.image_url_ai_suggested} alt="AI" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] py-0.5 text-center">AI</span>
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleApproveImage(crop, 'ai')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        यो प्रयोग
                      </Button>
                    </div>
                  )}
                  {crop.image_url_uploaded && (
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => { setPreviewImage(crop.image_url_uploaded); setPreviewCrop(crop); }}
                        className="relative w-16 h-16 rounded overflow-hidden border-2 hover:border-primary transition-colors"
                      >
                        <img src={crop.image_url_uploaded} alt="Uploaded" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] py-0.5 text-center">अपलोड</span>
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleApproveImage(crop, 'admin_upload')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        यो प्रयोग
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateAIImage(crop)}
                disabled={isGenerating}
                className="text-xs h-8"
              >
                {isGenerating ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                AI फोटो
              </Button>

              <Label className="cursor-pointer">
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  disabled={isUploading}
                  className="text-xs h-8"
                >
                  <span>
                    {isUploading ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3 mr-1" />
                    )}
                    अपलोड
                  </span>
                </Button>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(crop, file);
                    e.target.value = '';
                  }}
                />
              </Label>

              {crop.image_url && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setPreviewImage(crop.image_url); setPreviewCrop(crop); }}
                    className="text-xs h-8"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    हेर्नुहोस्
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8 text-destructive"
                    onClick={() => handleRemoveImage(crop)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    हटाउनुहोस्
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            बाली फोटो व्यवस्थापन
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                बाली फोटो व्यवस्थापन
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI बाट फोटो बनाउनुहोस् वा आफ्नो अपलोड गर्नुहोस्
              </p>
            </div>
            <div className="flex gap-2 text-xs flex-wrap">
              <Badge variant="destructive">{needsReview.length} समीक्षा</Badge>
              <Badge variant="default">{hasImage.length} तयार</Badge>
              <Badge variant="secondary">{noImage.length} फोटो छैन</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="बाली खोज्नुहोस्..."
              className="pl-10"
            />
          </div>

          {/* Needs Review Section */}
          {needsReview.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                समीक्षा आवश्यक ({needsReview.length})
              </h3>
              <div className="space-y-3">
                {needsReview.map(crop => (
                  <CropPhotoCard key={crop.id} crop={crop} />
                ))}
              </div>
            </div>
          )}

          {/* All Crops Section */}
          <div>
            <h3 className="font-semibold text-sm mb-3">
              सबै बालीहरू ({filteredCrops.length})
            </h3>
            <div className="space-y-3">
              {filteredCrops.map(crop => (
                <CropPhotoCard key={crop.id} crop={crop} />
              ))}
            </div>
          </div>

          {filteredCrops.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              कुनै बाली फेला परेन।
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => { setPreviewImage(null); setPreviewCrop(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewCrop?.name_ne} - फोटो
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={previewImage} 
                alt="Preview"
                className="w-full h-auto max-h-[60vh] object-contain bg-muted"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
