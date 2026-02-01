import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocationData } from '@/hooks/useLocationData';
import { Mountain, MapPin, Loader2 } from 'lucide-react';

// Common field name suggestions in Nepali
const fieldNameSuggestions = [
  { label: 'घर अगाडिको खेत', description: 'घर अगाडि रहेको खेत' },
  { label: 'घर पछाडिको खेत', description: 'घर पछाडि रहेको खेत' },
  { label: 'माथिल्लो खेत', description: 'माथिल्लो भागको खेत' },
  { label: 'तल्लो खेत', description: 'तल्लो भागको खेत' },
  { label: 'पूर्वी खेत', description: 'पूर्व दिशाको खेत' },
  { label: 'पश्चिमी खेत', description: 'पश्चिम दिशाको खेत' },
  { label: 'खोलाको खेत', description: 'खोला नजिकको खेत' },
  { label: 'बाटोको खेत', description: 'बाटो छेउको खेत' },
  { label: 'धानखेत', description: 'धान लगाउने खेत' },
  { label: 'तरकारी बारी', description: 'तरकारी खेती गर्ने बारी' },
  { label: 'फलफूल बारी', description: 'फलफूल लगाएको बारी' },
  { label: 'मकै खेत', description: 'मकै लगाउने खेत' },
  { label: 'आलु खेत', description: 'आलु लगाउने खेत' },
  { label: 'किसान खेत', description: 'मुख्य खेती क्षेत्र' },
];

const areaUnits = [
  { value: 'ropani', label: 'रोपनी' },
  { value: 'katha', label: 'कठ्ठा' },
  { value: 'bigha', label: 'बिघा' },
  { value: 'hectare', label: 'हेक्टर' },
];

// Local level type labels in Nepali
const localLevelTypeLabels: Record<string, string> = {
  metropolitan: 'महानगरपालिका',
  sub_metropolitan: 'उपमहानगरपालिका',
  municipality: 'नगरपालिका',
  rural_municipality: 'गाउँपालिका',
};

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
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('ropani');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    provinces,
    districts,
    localLevels,
    availableWards,
    selectedProvinceId,
    selectedDistrictId,
    selectedLocalLevelId,
    selectedWardNumber,
    handleProvinceChange,
    handleDistrictChange,
    handleLocalLevelChange,
    handleWardChange,
    resetFilters,
    isLoading,
  } = useLocationData();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setArea('');
      setAreaUnit('ropani');
      resetFilters();
    }
  }, [open, resetFilters]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Get district and local level names for storage
      const selectedDistrict = districts.find(d => d.id === selectedDistrictId);
      const selectedLocalLevel = localLevels.find(ll => ll.id === selectedLocalLevelId);
      
      // Build municipality string with type
      let municipalityString = '';
      if (selectedLocalLevel) {
        const typeLabel = localLevelTypeLabels[selectedLocalLevel.type] || '';
        municipalityString = `${selectedLocalLevel.name_ne}`;
        if (selectedWardNumber) {
          municipalityString += ` वडा नं. ${selectedWardNumber}`;
        }
      }

      await onSubmit({
        name: name.trim(),
        area: area ? parseFloat(area) : null,
        area_unit: areaUnit,
        district: selectedDistrict?.name_ne || null,
        municipality: municipalityString || null,
        latitude: null,
        longitude: null,
      });
      
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSuggestedName = (suggestion: string) => {
    setName(suggestion);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            नयाँ खेत थप्नुहोस्
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {/* Field Name */}
          <div className="space-y-2">
            <Label>खेतको नाम *</Label>
            <Input
              placeholder="खेतको नाम लेख्नुहोस्"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            {/* Name Suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">वा यी मध्ये एउटा छान्नुहोस्:</p>
              <div className="flex flex-wrap gap-2">
                {fieldNameSuggestions.slice(0, 8).map((suggestion) => (
                  <Badge
                    key={suggestion.label}
                    variant={name === suggestion.label ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => selectSuggestedName(suggestion.label)}
                  >
                    {suggestion.label}
                  </Badge>
                ))}
              </div>
              {/* Show more suggestions */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  थप सुझावहरू हेर्नुहोस्
                </summary>
                <div className="flex flex-wrap gap-2 mt-2">
                  {fieldNameSuggestions.slice(8).map((suggestion) => (
                    <Badge
                      key={suggestion.label}
                      variant={name === suggestion.label ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => selectSuggestedName(suggestion.label)}
                    >
                      {suggestion.label}
                    </Badge>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Area */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>क्षेत्रफल</Label>
              <Input
                type="number"
                placeholder="5"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>एकाइ</Label>
              <Select value={areaUnit} onValueChange={setAreaUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areaUnits.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>स्थान छान्नुहोस्</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Province */}
                <div className="space-y-1.5">
                  <Label className="text-xs">प्रदेश</Label>
                  <Select
                    value={selectedProvinceId?.toString() || '_none'}
                    onValueChange={(v) => handleProvinceChange(v === '_none' ? null : parseInt(v))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="प्रदेश छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">छान्नुहोस्...</SelectItem>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name_ne}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <Label className="text-xs">जिल्ला</Label>
                  <Select
                    value={selectedDistrictId?.toString() || '_none'}
                    onValueChange={(v) => handleDistrictChange(v === '_none' ? null : parseInt(v))}
                    disabled={!selectedProvinceId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="जिल्ला छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">छान्नुहोस्...</SelectItem>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name_ne}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Local Level (Municipality/Rural Municipality) */}
                <div className="space-y-1.5">
                  <Label className="text-xs">स्थानीय तह</Label>
                  <Select
                    value={selectedLocalLevelId?.toString() || '_none'}
                    onValueChange={(v) => handleLocalLevelChange(v === '_none' ? null : parseInt(v))}
                    disabled={!selectedDistrictId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="पालिका छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="_none">छान्नुहोस्...</SelectItem>
                      {localLevels.map((ll) => (
                        <SelectItem key={ll.id} value={ll.id.toString()}>
                          <span className="flex items-center gap-1.5">
                            {ll.name_ne}
                            <span className="text-[10px] text-muted-foreground">
                              ({localLevelTypeLabels[ll.type] || ll.type})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ward */}
                <div className="space-y-1.5">
                  <Label className="text-xs">वडा</Label>
                  <Select
                    value={selectedWardNumber?.toString() || '_none'}
                    onValueChange={(v) => handleWardChange(v === '_none' ? null : parseInt(v))}
                    disabled={!selectedLocalLevelId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="वडा छान्नुहोस्" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value="_none">छान्नुहोस्...</SelectItem>
                      {availableWards.map((w) => (
                        <SelectItem key={w} value={w.toString()}>
                          वडा नं. {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                थप्दै...
              </>
            ) : (
              'खेत थप्नुहोस्'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
