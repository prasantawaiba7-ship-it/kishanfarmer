import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, Loader2, RefreshCw, Shield, Zap, Mail, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface AppSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
}

export const AppSettingsManager = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
      
      // Initialize edited values
      const values: Record<string, any> = {};
      data?.forEach(s => {
        values[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
      });
      setEditedValues(values);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: JSON.stringify(editedValues[key]) })
        .eq('key', key);

      if (error) throw error;
      toast.success(`Setting "${key}" updated successfully`);
      fetchSettings();
    } catch (err) {
      console.error('Failed to save setting:', err);
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'limits': return <Zap className="h-4 w-4" />;
      case 'features': return <Settings className="h-4 w-4" />;
      case 'system': return <Shield className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'limits': return 'Usage Limits';
      case 'features': return 'Feature Flags';
      case 'system': return 'System Settings';
      default: return category;
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, AppSetting[]>);

  const renderSettingInput = (setting: AppSetting) => {
    const value = editedValues[setting.key];
    const originalValue = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    const hasChanged = JSON.stringify(value) !== JSON.stringify(originalValue);

    // Boolean settings (feature flags)
    if (value === true || value === false || value === 'true' || value === 'false') {
      const boolValue = value === true || value === 'true';
      return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex-1">
            <Label className="font-medium capitalize">
              {setting.key.replace(/_/g, ' ')}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
          </div>
          <Switch
            checked={boolValue}
            onCheckedChange={(checked) => {
              handleValueChange(setting.key, checked);
              // Auto-save for toggles
              setTimeout(() => {
                supabase
                  .from('app_settings')
                  .update({ value: JSON.stringify(checked) })
                  .eq('key', setting.key)
                  .then(({ error }) => {
                    if (error) {
                      toast.error('Failed to update setting');
                    } else {
                      toast.success('Setting updated');
                    }
                  });
              }, 100);
            }}
          />
        </div>
      );
    }

    // Numeric settings
    if (typeof value === 'number' || !isNaN(Number(value))) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <div className="flex-1">
            <Label className="font-medium capitalize">
              {setting.key.replace(/_/g, ' ')}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => handleValueChange(setting.key, Number(e.target.value))}
              className="w-24"
            />
            {hasChanged && (
              <Button size="sm" onClick={() => handleSave(setting.key)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      );
    }

    // String settings
    return (
      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
        <div className="flex-1">
          <Label className="font-medium capitalize">
            {setting.key.replace(/_/g, ' ')}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={value || ''}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className="flex-1"
          />
          {hasChanged && (
            <Button size="sm" onClick={() => handleSave(setting.key)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">App Settings</h2>
          <p className="text-muted-foreground">Configure feature flags, limits, and system settings</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
            </CardTitle>
            <CardDescription>
              {category === 'limits' && 'Control usage limits for free and premium users'}
              {category === 'features' && 'Enable or disable app features globally'}
              {category === 'system' && 'System-level configuration options'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorySettings.map((setting) => (
              <div key={setting.id}>
                {renderSettingInput(setting)}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
