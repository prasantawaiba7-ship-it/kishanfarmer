import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCrops } from '@/hooks/useCrops';
import { Plus, Edit, Trash2, BookOpen, Loader2, Search, Filter } from 'lucide-react';
import { GuideSection, SECTION_LABELS } from '@/hooks/useCropGuides';

interface CropGuide {
  id: string;
  crop_name: string;
  crop_id: number | null;
  section: GuideSection;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  display_order: number;
  step_number: number;
  media_url: string | null;
  version: number;
  is_active: boolean;
  is_published: boolean;
}

const SECTIONS = Object.keys(SECTION_LABELS) as GuideSection[];

export function CropGuidesManager() {
  const { toast } = useToast();
  const { activeCrops } = useCrops();
  const [guides, setGuides] = useState<CropGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<CropGuide | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    crop_name: '',
    crop_id: null as number | null,
    section: 'introduction' as GuideSection,
    title: '',
    title_ne: '',
    content: '',
    content_ne: '',
    display_order: 0,
    step_number: 0,
    media_url: '',
    is_active: true,
    is_published: true,
  });

  const fetchGuides = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('crop_guides')
      .select('*')
      .order('crop_name')
      .order('display_order');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch guides', variant: 'destructive' });
    } else {
      setGuides((data as CropGuide[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleOpenDialog = (guide?: CropGuide) => {
    if (guide) {
      setEditingGuide(guide);
      setFormData({
        crop_name: guide.crop_name,
        crop_id: guide.crop_id,
        section: guide.section,
        title: guide.title,
        title_ne: guide.title_ne || '',
        content: guide.content,
        content_ne: guide.content_ne || '',
        display_order: guide.display_order,
        step_number: guide.step_number || 0,
        media_url: guide.media_url || '',
        is_active: guide.is_active,
        is_published: guide.is_published,
      });
    } else {
      setEditingGuide(null);
      const firstCrop = activeCrops[0];
      setFormData({
        crop_name: firstCrop?.name_ne || '',
        crop_id: firstCrop?.id || null,
        section: 'introduction',
        title: '',
        title_ne: '',
        content: '',
        content_ne: '',
        display_order: 0,
        step_number: 0,
        media_url: '',
        is_active: true,
        is_published: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.crop_name || !formData.title || !formData.content) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    if (editingGuide) {
      const { error } = await supabase
        .from('crop_guides')
        .update({
          crop_name: formData.crop_name,
          crop_id: formData.crop_id,
          section: formData.section,
          title: formData.title,
          title_ne: formData.title_ne || null,
          content: formData.content,
          content_ne: formData.content_ne || null,
          display_order: formData.display_order,
          step_number: formData.step_number,
          media_url: formData.media_url || null,
          is_active: formData.is_active,
          is_published: formData.is_published,
        })
        .eq('id', editingGuide.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update guide', variant: 'destructive' });
      } else {
        toast({ title: 'सफल!', description: 'गाइड अपडेट भयो' });
        setIsDialogOpen(false);
        fetchGuides();
      }
    } else {
      const { error } = await supabase
        .from('crop_guides')
        .insert({
          crop_name: formData.crop_name,
          crop_id: formData.crop_id,
          section: formData.section,
          title: formData.title,
          title_ne: formData.title_ne || null,
          content: formData.content,
          content_ne: formData.content_ne || null,
          display_order: formData.display_order,
          step_number: formData.step_number,
          media_url: formData.media_url || null,
          is_active: formData.is_active,
          is_published: formData.is_published,
        });

      if (error) {
        toast({ title: 'Error', description: 'Failed to create guide', variant: 'destructive' });
      } else {
        toast({ title: 'सफल!', description: 'नयाँ गाइड थपियो' });
        setIsDialogOpen(false);
        fetchGuides();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('यो गाइड मेटाउने हो?')) return;

    const { error } = await supabase.from('crop_guides').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete guide', variant: 'destructive' });
    } else {
      toast({ title: 'मेटाइयो!', description: 'गाइड मेटाइयो' });
      fetchGuides();
    }
  };

  const handleToggleActive = async (guide: CropGuide) => {
    const { error } = await supabase
      .from('crop_guides')
      .update({ is_active: !guide.is_active })
      .eq('id', guide.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      fetchGuides();
    }
  };

  // Get unique crop names from guides
  const uniqueCrops = [...new Set(guides.map(g => g.crop_name))];

  // Filter guides
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (guide.title_ne && guide.title_ne.includes(searchQuery));
    const matchesCrop = filterCrop === 'all' || guide.crop_name === filterCrop;
    const matchesSection = filterSection === 'all' || guide.section === filterSection;
    return matchesSearch && matchesCrop && matchesSection;
  });

  // Group by crop name
  const groupedGuides = filteredGuides.reduce((acc, guide) => {
    if (!acc[guide.crop_name]) {
      acc[guide.crop_name] = [];
    }
    acc[guide.crop_name].push(guide);
    return acc;
  }, {} as Record<string, CropGuide[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            खेती गाइड ({guides.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            {uniqueCrops.length} बालीमा गाइड उपलब्ध
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              नयाँ गाइड
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGuide ? 'गाइड सम्पादन' : 'नयाँ गाइड थप्नुहोस्'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>बाली छान्नुहोस् *</Label>
                  <Select 
                    value={formData.crop_name} 
                    onValueChange={(v) => {
                      const selectedCrop = activeCrops.find(c => c.name_ne === v);
                      setFormData({ 
                        ...formData, 
                        crop_name: v,
                        crop_id: selectedCrop?.id || null
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="बाली छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCrops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.name_ne}>
                          <div className="flex items-center gap-2">
                            {crop.image_url && (
                              <img src={crop.image_url} alt="" className="w-5 h-5 rounded object-cover" />
                            )}
                            {crop.name_ne} ({crop.name_en})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>खण्ड (Section) *</Label>
                  <Select 
                    value={formData.section} 
                    onValueChange={(v) => setFormData({ ...formData, section: v as GuideSection })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SECTION_LABELS[s].icon} {SECTION_LABELS[s].ne}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (English) *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>शीर्षक (नेपाली)</Label>
                  <Input
                    value={formData.title_ne}
                    onChange={(e) => setFormData({ ...formData, title_ne: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content (English) *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  required
                  placeholder="Detailed guide content in English..."
                />
              </div>

              <div className="space-y-2">
                <Label>विवरण (नेपाली)</Label>
                <Textarea
                  value={formData.content_ne}
                  onChange={(e) => setFormData({ ...formData, content_ne: e.target.value })}
                  rows={5}
                  placeholder="नेपालीमा विस्तृत गाइड..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>क्रम (Display Order)</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>चरण नम्बर (Step Number)</Label>
                  <Input
                    type="number"
                    value={formData.step_number}
                    onChange={(e) => setFormData({ ...formData, step_number: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>मिडिया URL (Optional)</Label>
                <Input
                  value={formData.media_url}
                  onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>सक्रिय</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>प्रकाशित</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingGuide ? 'अपडेट गर्नुहोस्' : 'थप्नुहोस्'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="खोज्नुहोस्..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCrop} onValueChange={setFilterCrop}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="बाली" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">सबै बाली</SelectItem>
            {uniqueCrops.map(crop => (
              <SelectItem key={crop} value={crop}>{crop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="खण्ड" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">सबै खण्ड</SelectItem>
            {SECTIONS.map(s => (
              <SelectItem key={s} value={s}>
                {SECTION_LABELS[s].icon} {SECTION_LABELS[s].ne}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{uniqueCrops.length}</p>
            <p className="text-xs text-muted-foreground">बालीहरू</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{guides.length}</p>
            <p className="text-xs text-muted-foreground">गाइड विषय</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{guides.filter(g => g.is_active).length}</p>
            <p className="text-xs text-muted-foreground">सक्रिय</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{guides.filter(g => !g.is_active).length}</p>
            <p className="text-xs text-muted-foreground">निष्क्रिय</p>
          </CardContent>
        </Card>
      </div>

      {/* Guides List */}
      {Object.keys(groupedGuides).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>कुनै गाइड फेला परेन।</p>
            <p className="text-sm">नयाँ गाइड थप्नुहोस्!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedGuides).map(([cropName, cropGuides]) => (
            <Card key={cropName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>🌾 {cropName}</span>
                  <Badge variant="secondary">{cropGuides.length} विषय</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">खण्ड</TableHead>
                        <TableHead>शीर्षक</TableHead>
                        <TableHead className="w-16">क्रम</TableHead>
                        <TableHead className="w-20">स्थिति</TableHead>
                        <TableHead className="text-right w-24">कार्य</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cropGuides.map((guide) => (
                        <TableRow key={guide.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {SECTION_LABELS[guide.section]?.icon} {SECTION_LABELS[guide.section]?.ne}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{guide.title_ne || guide.title}</p>
                              {guide.title_ne && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{guide.title}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{guide.display_order}</TableCell>
                          <TableCell>
                            <Switch
                              checked={guide.is_active}
                              onCheckedChange={() => handleToggleActive(guide)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(guide)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(guide.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
