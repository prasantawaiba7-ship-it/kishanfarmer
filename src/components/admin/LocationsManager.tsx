import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2, Users } from 'lucide-react';

interface Province {
  id: number;
  name_ne: string;
  name_en: string;
}

interface District {
  id: number;
  province_id: number;
  name_ne: string;
  name_en: string;
}

interface LocalLevel {
  id: number;
  district_id: number;
  name_ne: string;
  name_en: string;
  type: string;
  total_wards: number;
}

const TYPE_LABELS: Record<string, string> = {
  metropolitan: 'महानगरपालिका',
  sub_metropolitan: 'उपमहानगरपालिका',
  municipality: 'नगरपालिका',
  rural_municipality: 'गाउँपालिका',
};

export function LocationsManager() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [localLevels, setLocalLevels] = useState<LocalLevel[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ provinces: 0, districts: 0, localLevels: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch provinces
        const { data: provincesData } = await supabase
          .from('provinces')
          .select('*')
          .order('display_order');

        setProvinces((provincesData || []) as Province[]);

        // Get counts
        const [{ count: districtCount }, { count: localLevelCount }] = await Promise.all([
          supabase.from('districts').select('*', { count: 'exact', head: true }),
          supabase.from('local_levels').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          provinces: provincesData?.length || 0,
          districts: districtCount || 0,
          localLevels: localLevelCount || 0,
        });
      } catch (err) {
        console.error('Error loading location data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvinceId) {
        setDistricts([]);
        return;
      }

      const { data } = await supabase
        .from('districts')
        .select('*')
        .eq('province_id', selectedProvinceId)
        .order('display_order');

      setDistricts((data || []) as District[]);
      setSelectedDistrictId(null);
      setLocalLevels([]);
    };

    fetchDistricts();
  }, [selectedProvinceId]);

  // Fetch local levels when district changes
  useEffect(() => {
    const fetchLocalLevels = async () => {
      if (!selectedDistrictId) {
        setLocalLevels([]);
        return;
      }

      const { data } = await supabase
        .from('local_levels')
        .select('*')
        .eq('district_id', selectedDistrictId)
        .order('display_order');

      setLocalLevels((data || []) as LocalLevel[]);
    };

    fetchLocalLevels();
  }, [selectedDistrictId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            स्थान व्यवस्थापन
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          स्थान व्यवस्थापन
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.provinces}</div>
              <div className="text-xs text-muted-foreground">प्रदेश</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.districts}</div>
              <div className="text-xs text-muted-foreground">जिल्ला</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.localLevels}</div>
              <div className="text-xs text-muted-foreground">स्थानीय तह</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">प्रदेश छान्नुहोस्</label>
            <Select
              value={selectedProvinceId?.toString() || ''}
              onValueChange={(v) => setSelectedProvinceId(v ? parseInt(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="प्रदेश छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name_ne}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">जिल्ला छान्नुहोस्</label>
            <Select
              value={selectedDistrictId?.toString() || ''}
              onValueChange={(v) => setSelectedDistrictId(v ? parseInt(v) : null)}
              disabled={!selectedProvinceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="जिल्ला छान्नुहोस्" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name_ne}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Districts Table */}
        {selectedProvinceId && districts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">जिल्लाहरू ({districts.length})</h4>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>नाम (ने.)</TableHead>
                    <TableHead>Name (En)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {districts.map((d) => (
                    <TableRow 
                      key={d.id} 
                      className={selectedDistrictId === d.id ? 'bg-muted' : ''}
                      onClick={() => setSelectedDistrictId(d.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell className="font-medium">{d.name_ne}</TableCell>
                      <TableCell>{d.name_en}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Local Levels Table */}
        {selectedDistrictId && localLevels.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">स्थानीय तह ({localLevels.length})</h4>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>नाम</TableHead>
                    <TableHead>प्रकार</TableHead>
                    <TableHead>वडा संख्या</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localLevels.map((ll) => (
                    <TableRow key={ll.id}>
                      <TableCell className="font-medium">{ll.name_ne}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TYPE_LABELS[ll.type] || ll.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{ll.total_wards}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* No data message */}
        {selectedProvinceId && districts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            यो प्रदेशमा जिल्ला थपिएको छैन।
          </div>
        )}
      </CardContent>
    </Card>
  );
}
