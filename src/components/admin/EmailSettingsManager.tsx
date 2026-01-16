import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Edit, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailSetting {
  id: string;
  event_type: string;
  enabled: boolean;
  subject_template: string;
  body_template: string;
  created_at: string;
  updated_at: string;
}

export const EmailSettingsManager = () => {
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; setting: EmailSetting | null }>({
    open: false,
    setting: null
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .order('event_type', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err) {
      console.error('Failed to fetch email settings:', err);
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpenEdit = (setting: EmailSetting) => {
    setEditDialog({ open: true, setting: { ...setting } });
  };

  const handleSave = async () => {
    if (!editDialog.setting) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_settings')
        .update({
          enabled: editDialog.setting.enabled,
          subject_template: editDialog.setting.subject_template,
          body_template: editDialog.setting.body_template
        })
        .eq('id', editDialog.setting.id);

      if (error) throw error;
      toast.success('Email template updated');
      setEditDialog({ open: false, setting: null });
      fetchSettings();
    } catch (err) {
      console.error('Failed to save email setting:', err);
      toast.error('Failed to save email setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (setting: EmailSetting) => {
    try {
      const { error } = await supabase
        .from('email_settings')
        .update({ enabled: !setting.enabled })
        .eq('id', setting.id);

      if (error) throw error;
      toast.success(`Email ${setting.enabled ? 'disabled' : 'enabled'}`);
      fetchSettings();
    } catch (err) {
      console.error('Failed to toggle email setting:', err);
      toast.error('Failed to update email setting');
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'welcome': return 'Welcome Email';
      case 'subscription_activated': return 'Subscription Activated';
      case 'subscription_expired': return 'Subscription Expired';
      case 'subscription_cancelled': return 'Subscription Cancelled';
      default: return eventType.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Settings</h2>
          <p className="text-muted-foreground">Configure email notifications and templates</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Email Configuration</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Emails are sent using Resend. Make sure to verify your domain in Resend dashboard for production use.
                Available placeholders: {"{{name}}"}, {"{{email}}"}, {"{{plan}}"}, {"{{end_date}}"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>Configure when and what emails are sent to users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id} className={!setting.enabled ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{getEventLabel(setting.event_type)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{setting.subject_template}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={() => handleToggleEnabled(setting)}
                        />
                        {setting.enabled ? (
                          <Badge className="bg-green-500">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(setting)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Configure the email template for {editDialog.setting && getEventLabel(editDialog.setting.event_type)}
            </DialogDescription>
          </DialogHeader>

          {editDialog.setting && (
            <div className="space-y-4">
              <div>
                <Label>Event Type</Label>
                <Input value={getEventLabel(editDialog.setting.event_type)} disabled />
              </div>

              <div>
                <Label>Subject Line</Label>
                <Input
                  value={editDialog.setting.subject_template}
                  onChange={(e) => setEditDialog({
                    ...editDialog,
                    setting: { ...editDialog.setting!, subject_template: e.target.value }
                  })}
                />
              </div>

              <div>
                <Label>Email Body</Label>
                <Textarea
                  value={editDialog.setting.body_template}
                  onChange={(e) => setEditDialog({
                    ...editDialog,
                    setting: { ...editDialog.setting!, body_template: e.target.value }
                  })}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Available placeholders: {"{{name}}"}, {"{{email}}"}, {"{{plan}}"}, {"{{end_date}}"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editDialog.setting.enabled}
                  onCheckedChange={(checked) => setEditDialog({
                    ...editDialog,
                    setting: { ...editDialog.setting!, enabled: checked }
                  })}
                />
                <Label>Send this email</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, setting: null })}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
