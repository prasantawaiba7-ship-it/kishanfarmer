import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, RefreshCw, Edit2, Save, X, PlayCircle, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Json } from "@/integrations/supabase/types";

interface TreatmentStep {
  step_number: number;
  title: string;
  title_ne?: string;
  description: string;
  description_ne?: string;
  image_url?: string;
}

interface CropTreatment {
  id: string;
  crop_name: string;
  disease_or_pest_name: string;
  disease_or_pest_name_ne: string | null;
  treatment_title: string;
  treatment_title_ne: string | null;
  treatment_steps: TreatmentStep[];
  treatment_steps_ne: TreatmentStep[] | null;
  chemical_treatment: string | null;
  chemical_treatment_ne: string | null;
  organic_treatment: string | null;
  organic_treatment_ne: string | null;
  youtube_video_url: string | null;
  video_thumbnail_url: string | null;
  images: string[];
  severity_level: string;
  estimated_recovery_days: number | null;
  cost_estimate: string | null;
  best_season: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Crop {
  id: string;
  name: string;
  name_ne: string;
  diseases: string[];
  is_active: boolean;
}

const CropTreatmentManager = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<CropTreatment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    crop_name: "",
    disease_or_pest_name: "",
    disease_or_pest_name_ne: "",
    treatment_title: "",
    treatment_title_ne: "",
    treatment_steps: [] as TreatmentStep[],
    chemical_treatment: "",
    chemical_treatment_ne: "",
    organic_treatment: "",
    organic_treatment_ne: "",
    youtube_video_url: "",
    severity_level: "medium",
    estimated_recovery_days: 7,
    cost_estimate: "",
    best_season: "",
    is_active: true
  });

  // Fetch crops from app_settings
  const { data: crops = [] } = useQuery({
    queryKey: ['admin-crops-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'crops_list')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return (data?.value as unknown as Crop[]) || [];
    }
  });

  // Fetch all treatments
  const { data: treatments = [], isLoading, refetch } = useQuery({
    queryKey: ['crop-treatments-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crop_treatments')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data.map(t => ({
        ...t,
        treatment_steps: (t.treatment_steps as unknown as TreatmentStep[]) || [],
        treatment_steps_ne: (t.treatment_steps_ne as unknown as TreatmentStep[]) || [],
        images: (t.images as unknown as string[]) || []
      })) as CropTreatment[];
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CropTreatment>) => {
      const payload = {
        crop_name: data.crop_name,
        disease_or_pest_name: data.disease_or_pest_name,
        disease_or_pest_name_ne: data.disease_or_pest_name_ne || null,
        treatment_title: data.treatment_title,
        treatment_title_ne: data.treatment_title_ne || null,
        treatment_steps: data.treatment_steps as unknown as Json,
        chemical_treatment: data.chemical_treatment || null,
        chemical_treatment_ne: data.chemical_treatment_ne || null,
        organic_treatment: data.organic_treatment || null,
        organic_treatment_ne: data.organic_treatment_ne || null,
        youtube_video_url: data.youtube_video_url || null,
        images: (data.images || []) as unknown as Json,
        severity_level: data.severity_level || 'medium',
        estimated_recovery_days: data.estimated_recovery_days || null,
        cost_estimate: data.cost_estimate || null,
        best_season: data.best_season || null,
        is_active: data.is_active ?? true
      };

      if (editingTreatment) {
        const { error } = await supabase
          .from('crop_treatments')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTreatment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crop_treatments')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-treatments-admin'] });
      setDialogOpen(false);
      toast.success(editingTreatment ? "उपचार विधि अपडेट भयो!" : "नयाँ उपचार विधि थपियो!");
    },
    onError: (error) => {
      console.error('Error saving treatment:', error);
      toast.error("सेभ गर्न असफल");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crop_treatments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-treatments-admin'] });
      toast.success("उपचार विधि मेटियो!");
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('crop_treatments')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-treatments-admin'] });
    }
  });

  const handleOpenDialog = (treatment?: CropTreatment) => {
    if (treatment) {
      setEditingTreatment(treatment);
      setFormData({
        crop_name: treatment.crop_name,
        disease_or_pest_name: treatment.disease_or_pest_name,
        disease_or_pest_name_ne: treatment.disease_or_pest_name_ne || "",
        treatment_title: treatment.treatment_title,
        treatment_title_ne: treatment.treatment_title_ne || "",
        treatment_steps: treatment.treatment_steps || [],
        chemical_treatment: treatment.chemical_treatment || "",
        chemical_treatment_ne: treatment.chemical_treatment_ne || "",
        organic_treatment: treatment.organic_treatment || "",
        organic_treatment_ne: treatment.organic_treatment_ne || "",
        youtube_video_url: treatment.youtube_video_url || "",
        severity_level: treatment.severity_level,
        estimated_recovery_days: treatment.estimated_recovery_days || 7,
        cost_estimate: treatment.cost_estimate || "",
        best_season: treatment.best_season || "",
        is_active: treatment.is_active
      });
    } else {
      setEditingTreatment(null);
      setFormData({
        crop_name: "",
        disease_or_pest_name: "",
        disease_or_pest_name_ne: "",
        treatment_title: "",
        treatment_title_ne: "",
        treatment_steps: [],
        chemical_treatment: "",
        chemical_treatment_ne: "",
        organic_treatment: "",
        organic_treatment_ne: "",
        youtube_video_url: "",
        severity_level: "medium",
        estimated_recovery_days: 7,
        cost_estimate: "",
        best_season: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      treatment_steps: [
        ...prev.treatment_steps,
        {
          step_number: prev.treatment_steps.length + 1,
          title: "",
          title_ne: "",
          description: "",
          description_ne: ""
        }
      ]
    }));
  };

  const handleUpdateStep = (index: number, field: keyof TreatmentStep, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      treatment_steps: prev.treatment_steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      treatment_steps: prev.treatment_steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, step_number: i + 1 }))
    }));
  };

  const handleSave = () => {
    if (!formData.crop_name || !formData.disease_or_pest_name || !formData.treatment_title) {
      toast.error("कृपया आवश्यक फिल्डहरू भर्नुहोस्");
      return;
    }

    saveMutation.mutate({
      ...formData,
      images: []
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("के तपाईं यो उपचार विधि मेट्न चाहनुहुन्छ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/10 text-warning border-warning/30';
      case 'low': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              बालीको उपचार विधि व्यवस्थापन
            </CardTitle>
            <CardDescription>
              बाली रोग/कीराको उपचार विधि, भिडियो र चरणबद्ध निर्देशन थप्नुहोस्
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              रिफ्रेस
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              नयाँ उपचार
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>कुनै उपचार विधि थपिएको छैन</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                पहिलो उपचार विधि थप्नुहोस्
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {treatments.map((treatment) => (
                <Card 
                  key={treatment.id} 
                  className={`transition-all ${!treatment.is_active ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{treatment.crop_name}</Badge>
                          <Badge className={getSeverityColor(treatment.severity_level)}>
                            {treatment.severity_level === 'high' ? 'उच्च' : 
                             treatment.severity_level === 'medium' ? 'मध्यम' : 'न्यून'}
                          </Badge>
                          {treatment.youtube_video_url && (
                            <Badge variant="secondary" className="gap-1">
                              <PlayCircle className="w-3 h-3" />
                              भिडियो
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg">
                          {treatment.disease_or_pest_name_ne || treatment.disease_or_pest_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {treatment.treatment_title_ne || treatment.treatment_title}
                        </p>
                        
                        <button
                          onClick={() => setExpandedId(expandedId === treatment.id ? null : treatment.id)}
                          className="flex items-center gap-1 text-sm text-primary mt-2"
                        >
                          {expandedId === treatment.id ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              कम देखाउनुहोस्
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              {treatment.treatment_steps.length} चरण देखाउनुहोस्
                            </>
                          )}
                        </button>

                        {expandedId === treatment.id && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-primary/20">
                            {treatment.treatment_steps.map((step, idx) => (
                              <div key={idx} className="text-sm">
                                <p className="font-medium">
                                  चरण {step.step_number}: {step.title_ne || step.title}
                                </p>
                                <p className="text-muted-foreground">
                                  {step.description_ne || step.description}
                                </p>
                              </div>
                            ))}
                            
                            {treatment.youtube_video_url && (
                              <div className="mt-4">
                                <a 
                                  href={treatment.youtube_video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-primary hover:underline"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  भिडियो हेर्नुहोस्
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={treatment.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: treatment.id, is_active: checked })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(treatment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(treatment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? "उपचार विधि सम्पादन" : "नयाँ उपचार विधि थप्नुहोस्"}
            </DialogTitle>
            <DialogDescription>
              बाली रोग/कीराको उपचार विधि विवरण भर्नुहोस्
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>बाली छान्नुहोस् *</Label>
                  <Select 
                    value={formData.crop_name} 
                    onValueChange={(val) => setFormData({ ...formData, crop_name: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="बाली छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.filter(c => c.is_active).map((crop) => (
                        <SelectItem key={crop.id} value={crop.name}>
                          {crop.name_ne} ({crop.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>गम्भीरता</Label>
                  <Select 
                    value={formData.severity_level} 
                    onValueChange={(val) => setFormData({ ...formData, severity_level: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">न्यून (Low)</SelectItem>
                      <SelectItem value="medium">मध्यम (Medium)</SelectItem>
                      <SelectItem value="high">उच्च (High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>रोग/कीरा नाम (English) *</Label>
                  <Input
                    value={formData.disease_or_pest_name}
                    onChange={(e) => setFormData({ ...formData, disease_or_pest_name: e.target.value })}
                    placeholder="e.g., Leaf Blight"
                  />
                </div>
                <div className="space-y-2">
                  <Label>रोग/कीरा नाम (नेपाली)</Label>
                  <Input
                    value={formData.disease_or_pest_name_ne}
                    onChange={(e) => setFormData({ ...formData, disease_or_pest_name_ne: e.target.value })}
                    placeholder="जस्तै, पातको डढुवा"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>उपचार शीर्षक (English) *</Label>
                  <Input
                    value={formData.treatment_title}
                    onChange={(e) => setFormData({ ...formData, treatment_title: e.target.value })}
                    placeholder="e.g., Complete Treatment Guide"
                  />
                </div>
                <div className="space-y-2">
                  <Label>उपचार शीर्षक (नेपाली)</Label>
                  <Input
                    value={formData.treatment_title_ne}
                    onChange={(e) => setFormData({ ...formData, treatment_title_ne: e.target.value })}
                    placeholder="जस्तै, पूर्ण उपचार गाइड"
                  />
                </div>
              </div>

              {/* Treatment Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>चरणबद्ध उपचार निर्देशन</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddStep}>
                    <Plus className="w-4 h-4 mr-1" />
                    चरण थप्नुहोस्
                  </Button>
                </div>
                
                {formData.treatment_steps.map((step, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        {step.step_number}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Step title (English)"
                            value={step.title}
                            onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                          />
                          <Input
                            placeholder="चरण शीर्षक (नेपाली)"
                            value={step.title_ne || ''}
                            onChange={(e) => handleUpdateStep(idx, 'title_ne', e.target.value)}
                          />
                        </div>
                        <Textarea
                          placeholder="विस्तृत निर्देशन..."
                          value={step.description}
                          onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        onClick={() => handleRemoveStep(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Chemical & Organic Treatment */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>रासायनिक उपचार</Label>
                  <Textarea
                    value={formData.chemical_treatment}
                    onChange={(e) => setFormData({ ...formData, chemical_treatment: e.target.value })}
                    placeholder="रासायनिक औषधि र मात्रा..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>जैविक उपचार</Label>
                  <Textarea
                    value={formData.organic_treatment}
                    onChange={(e) => setFormData({ ...formData, organic_treatment: e.target.value })}
                    placeholder="प्राकृतिक/जैविक उपचार विधि..."
                    rows={2}
                  />
                </div>
              </div>

              {/* YouTube Video */}
              <div className="space-y-2">
                <Label>YouTube भिडियो लिंक</Label>
                <Input
                  value={formData.youtube_video_url}
                  onChange={(e) => setFormData({ ...formData, youtube_video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {formData.youtube_video_url && getYouTubeVideoId(formData.youtube_video_url) && (
                  <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video max-w-sm">
                    <img 
                      src={`https://img.youtube.com/vi/${getYouTubeVideoId(formData.youtube_video_url)}/mqdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>अनुमानित रिकभरी (दिन)</Label>
                  <Input
                    type="number"
                    value={formData.estimated_recovery_days}
                    onChange={(e) => setFormData({ ...formData, estimated_recovery_days: parseInt(e.target.value) || 7 })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>अनुमानित खर्च</Label>
                  <Input
                    value={formData.cost_estimate}
                    onChange={(e) => setFormData({ ...formData, cost_estimate: e.target.value })}
                    placeholder="जस्तै, रु. 500-1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>उत्तम मौसम</Label>
                  <Input
                    value={formData.best_season}
                    onChange={(e) => setFormData({ ...formData, best_season: e.target.value })}
                    placeholder="जस्तै, वर्षा"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              रद्द
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "सेभ हुँदैछ..." : "सेभ गर्नुहोस्"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CropTreatmentManager;
