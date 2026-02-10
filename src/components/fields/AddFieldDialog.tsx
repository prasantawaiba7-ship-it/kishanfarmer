import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocationData } from '@/hooks/useLocationData';
import { useLanguage } from '@/hooks/useLanguage';
import { Mountain, MapPin, Loader2 } from 'lucide-react';

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    area: number | null;
    area_unit: string;
    district: string | null;
    municipality: string | null;
    latitude: number | null;
    longitude: number | null;
  }) => Promise<unknown>;
}

export function AddFieldDialog({ open, onOpenChange, onSubmit }: AddFieldDialogProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('ropani');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldNameSuggestions = [
    t('fieldFront'), t('fieldBack'), t('fieldUpper'), t('fieldLower'),
    t('fieldEast'), t('fieldWest'), t('fieldRiver'), t('fieldRoad'),
    t('fieldRice'), t('fieldVegetable'), t('fieldFruit'), t('fieldMaize'),
    t('fieldPotato'), t('fieldMain'),
  ];

  const areaUnits = [
    { value: 'ropani', label: t('ropani') },
    { value: 'katha', label: t('katha') },
    { value: 'bigha', label: t('bigha') },
    { value: 'hectare', label: t('hectare') },
  ];

  const localLevelTypeLabels: Record<string, string> = {
    metropolitan: language === 'ne' ? 'महानगरपालिका' : 'Metropolitan',
    sub_metropolitan: language === 'ne' ? 'उपमहानगरपालिका' : 'Sub-Metropolitan',
    municipality: language === 'ne' ? 'नगरपालिका' : 'Municipality',
    rural_municipality: language === 'ne' ? 'गाउँपालिका' : 'Rural Municipality',
  };

  const {
    provinces, districts, localLevels, availableWards,
    selectedProvinceId, selectedDistrictId, selectedLocalLevelId, selectedWardNumber,
    handleProvinceChange, handleDistrictChange, handleLocalLevelChange, handleWardChange,
    resetFilters, isLoading,
  } = useLocationData();

  useEffect(() => {
    if (!open) {
      setName(''); setArea(''); setAreaUnit('ropani'); resetFilters();
    }
  }, [open, resetFilters]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const selectedDistrict = districts.find(d => d.id === selectedDistrictId);
      const selectedLocalLevel = localLevels.find(ll => ll.id === selectedLocalLevelId);
      let municipalityString = '';
      if (selectedLocalLevel) {
        municipalityString = `${selectedLocalLevel.name_ne}`;
        if (selectedWardNumber) {
          municipalityString += ` ${t('wardNo')} ${selectedWardNumber}`;
        }
      }
      await onSubmit({
        name: name.trim(), area: area ? parseFloat(area) : null, area_unit: areaUnit,
        district: selectedDistrict?.name_ne || null, municipality: municipalityString || null,
        latitude: null, longitude: null,
      });
      onOpenChange(false);
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            {t('addNewField')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label>{t('fieldName')}</Label>
            <Input placeholder={t('fieldNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('orChooseOne')}</p>
              <div className="flex flex-wrap gap-2">
                {fieldNameSuggestions.slice(0, 8).map((suggestion) => (
                  <Badge key={suggestion} variant={name === suggestion ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setName(suggestion)}>{suggestion}</Badge>
                ))}
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">{t('moreSuggestions')}</summary>
                <div className="flex flex-wrap gap-2 mt-2">
                  {fieldNameSuggestions.slice(8).map((suggestion) => (
                    <Badge key={suggestion} variant={name === suggestion ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => setName(suggestion)}>{suggestion}</Badge>
                  ))}
                </div>
              </details>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('areaLabel')}</Label>
              <Input type="number" placeholder="5" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('unitLabel')}</Label>
              <Select value={areaUnit} onValueChange={setAreaUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{areaUnits.map((u) => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /><span>{t('selectLocation')}</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('province')}</Label>
                  <Select value={selectedProvinceId?.toString() || '_none'} onValueChange={(v) => handleProvinceChange(v === '_none' ? null : parseInt(v))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t('selectProvince')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                      {provinces.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.name_ne}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('district')}</Label>
                  <Select value={selectedDistrictId?.toString() || '_none'} onValueChange={(v) => handleDistrictChange(v === '_none' ? null : parseInt(v))} disabled={!selectedProvinceId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t('selectDistrict')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                      {districts.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name_ne}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === 'ne' ? 'स्थानीय तह' : 'Local Level'}</Label>
                  <Select value={selectedLocalLevelId?.toString() || '_none'} onValueChange={(v) => handleLocalLevelChange(v === '_none' ? null : parseInt(v))} disabled={!selectedDistrictId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t('selectLocalLevel')} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                      {localLevels.map((ll) => (
                        <SelectItem key={ll.id} value={ll.id.toString()}>
                          <span className="flex items-center gap-1.5">
                            {ll.name_ne}
                            <span className="text-[10px] text-muted-foreground">({localLevelTypeLabels[ll.type] || ll.type})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('ward')}</Label>
                  <Select value={selectedWardNumber?.toString() || '_none'} onValueChange={(v) => handleWardChange(v === '_none' ? null : parseInt(v))} disabled={!selectedLocalLevelId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t('selectWard')} /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                      {availableWards.map((w) => (<SelectItem key={w} value={w.toString()}>{t('wardNo')} {w}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('addingField')}</>) : t('addField')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
