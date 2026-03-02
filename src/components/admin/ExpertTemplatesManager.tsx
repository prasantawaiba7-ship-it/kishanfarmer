import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Search, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useExpertTemplates, useCreateExpertTemplate, useUpdateExpertTemplate, ExpertTemplate } from '@/hooks/useExpertTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Recommendation templates start

const COMMON_CROPS = ['धान', 'गहुँ', 'मकै', 'आलु', 'टमाटर', 'गोलभेडा', 'काउली', 'बन्दा', 'मूला', 'केरा'];

const emptyForm = {
  crop: '',
  disease: '',
  language: 'ne',
  title: '',
  body: '',
  title_ne: '',
  body_ne: '',
  title_en: '',
  body_en: '',
  tags: '' as string,
  is_active: true,
};

export function ExpertTemplatesManager() {
  const [filterCrop, setFilterCrop] = useState('');
  const [searchText, setSearchText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLang, setAiLang] = useState<'ne' | 'en'>('ne');
  const { toast } = useToast();

  const { data: templates, isLoading } = useExpertTemplates({
    crop: filterCrop || undefined,
    search: searchText || undefined,
  });

  const createTemplate = useCreateExpertTemplate();
  const updateTemplate = useUpdateExpertTemplate();

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (t: ExpertTemplate) => {
    setForm({
      crop: t.crop,
      disease: t.disease,
      language: t.language,
      title: t.title,
      body: t.body,
      title_ne: t.title_ne || '',
      body_ne: t.body_ne || '',
      title_en: t.title_en || '',
      body_en: t.body_en || '',
      tags: (t.tags || []).join(', '),
      is_active: t.is_active,
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const titleNe = form.title_ne.trim();
    const bodyNe = form.body_ne.trim();
    if (!form.crop.trim() || !form.disease.trim() || (!titleNe && !form.title_en.trim())) return;

    const payload = {
      crop: form.crop.trim(),
      disease: form.disease.trim(),
      language: form.language,
      title: titleNe || form.title_en.trim(),
      body: bodyNe || form.body_en.trim(),
      title_ne: titleNe || null,
      body_ne: bodyNe || null,
      title_en: form.title_en.trim() || null,
      body_en: form.body_en.trim() || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      is_active: form.is_active,
    };

    if (editingId) {
      updateTemplate.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createTemplate.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const toggleActive = (t: ExpertTemplate) => {
    updateTemplate.mutate({ id: t.id, is_active: !t.is_active });
  };

  const handleAiDraft = async () => {
    if (!form.crop.trim() || !form.disease.trim()) {
      toast({ title: 'बाली र रोग भर्नुहोस्', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-template-draft', {
        body: {
          crop: form.crop.trim(),
          disease: form.disease.trim(),
          language: aiLang,
          notes: form.tags || '',
        },
      });
      if (error) throw error;
      if (aiLang === 'ne') {
        setForm(f => ({
          ...f,
          title_ne: data.title || f.title_ne,
          body_ne: data.body || f.body_ne,
        }));
      } else {
        setForm(f => ({
          ...f,
          title_en: data.title || f.title_en,
          body_en: data.body || f.body_en,
        }));
      }
      toast({ title: '✅ AI draft तयार भयो — कृपया review गर्नुहोस्' });
    } catch (err: any) {
      toast({ title: 'AI draft असफल: ' + (err?.message || 'Unknown error'), variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            सिफारिश Templates
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> नयाँ Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="खोज्नुहोस्..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterCrop} onValueChange={v => setFilterCrop(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="बाली" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">सबै बाली</SelectItem>
              {COMMON_CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-6">लोड हुँदैछ...</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>शीर्षक</TableHead>
                  <TableHead>बाली</TableHead>
                  <TableHead>रोग/समस्या</TableHead>
                  <TableHead>भाषा</TableHead>
                  <TableHead>सक्रिय</TableHead>
                  <TableHead className="text-right">कार्य</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates && templates.length > 0 ? templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{t.title_ne || t.title}</TableCell>
                    <TableCell><Badge variant="outline">{t.crop}</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate">{t.disease}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {t.body_ne && <Badge variant="secondary" className="text-[10px]">NE</Badge>}
                        {t.body_en && <Badge variant="outline" className="text-[10px]">EN</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      कुनै template छैन।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Template सम्पादन' : 'नयाँ Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>बाली *</Label>
                  <Input value={form.crop} onChange={e => setForm(f => ({ ...f, crop: e.target.value }))} placeholder="आलु" />
                </div>
                <div>
                  <Label>रोग/समस्या *</Label>
                  <Input value={form.disease} onChange={e => setForm(f => ({ ...f, disease: e.target.value }))} placeholder="Late blight" />
                </div>
              </div>

              {/* AI Draft Section */}
              <div className="p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 space-y-2">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI बाट Draft बनाउनुहोस्
                </p>
                <div className="flex gap-2 items-end">
                  <Select value={aiLang} onValueChange={v => setAiLang(v as 'ne' | 'en')}>
                    <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ne">नेपाली</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleAiDraft} disabled={aiLoading} className="text-xs">
                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Generate Draft
                  </Button>
                </div>
              </div>

              {/* Language Tabs */}
              <Tabs defaultValue="ne" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="ne" className="flex-1">नेपाली</TabsTrigger>
                  <TabsTrigger value="en" className="flex-1">English</TabsTrigger>
                </TabsList>
                <TabsContent value="ne" className="space-y-3 mt-3">
                  <div>
                    <Label>शीर्षक (नेपाली)</Label>
                    <Input value={form.title_ne} onChange={e => setForm(f => ({ ...f, title_ne: e.target.value }))} placeholder="आलुमा ढुसी रोग नियन्त्रण" />
                  </div>
                  <div>
                    <Label>सिफारिश विवरण (नेपाली)</Label>
                    <Textarea
                      value={form.body_ne}
                      onChange={e => setForm(f => ({ ...f, body_ne: e.target.value }))}
                      rows={8}
                      placeholder="१) पहिचान: ...&#10;२) उपचार: ...&#10;सावधानी: ..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="en" className="space-y-3 mt-3">
                  <div>
                    <Label>Title (English)</Label>
                    <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} placeholder="Potato Late Blight Control" />
                  </div>
                  <div>
                    <Label>Recommendation Body (English)</Label>
                    <Textarea
                      value={form.body_en}
                      onChange={e => setForm(f => ({ ...f, body_en: e.target.value }))}
                      rows={8}
                      placeholder="1) Identification: ...&#10;2) Treatment: ...&#10;Precaution: ..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="fungicide, organic" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>सक्रिय</Label>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createTemplate.isPending || updateTemplate.isPending}>
                {editingId ? 'अपडेट गर्नुहोस्' : 'सिर्जना गर्नुहोस्'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Recommendation templates end
