import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Plus, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  key: string;
  title: string;
  content: string;
  language: string;
  content_type: string;
  active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const defaultBlock: Partial<ContentBlock> = {
  key: '',
  title: '',
  content: '',
  language: 'en',
  content_type: 'text',
  active: true,
  metadata: {}
};

export const ContentBlocksManager = () => {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; block: Partial<ContentBlock> | null; isNew: boolean }>({
    open: false,
    block: null,
    isNew: false
  });

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (err) {
      console.error('Failed to fetch content blocks:', err);
      toast.error('Failed to load content blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleOpenEdit = (block?: ContentBlock) => {
    if (block) {
      setEditDialog({ open: true, block: { ...block }, isNew: false });
    } else {
      setEditDialog({ open: true, block: { ...defaultBlock }, isNew: true });
    }
  };

  const handleSave = async () => {
    if (!editDialog.block) return;
    
    const block = editDialog.block;
    if (!block.key || !block.title || !block.content) {
      toast.error('Key, title, and content are required');
      return;
    }

    setSaving(true);
    try {
      const blockData = {
        key: block.key,
        title: block.title,
        content: block.content,
        language: block.language || 'en',
        content_type: block.content_type || 'text',
        active: block.active ?? true,
        metadata: block.metadata || {}
      };

      if (editDialog.isNew) {
        const { error } = await supabase
          .from('content_blocks')
          .insert([blockData]);
        if (error) throw error;
        toast.success('Content block created');
      } else {
        const { error } = await supabase
          .from('content_blocks')
          .update(blockData)
          .eq('id', block.id);
        if (error) throw error;
        toast.success('Content block updated');
      }

      setEditDialog({ open: false, block: null, isNew: false });
      fetchBlocks();
    } catch (err) {
      console.error('Failed to save content block:', err);
      toast.error('Failed to save content block');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (block: ContentBlock) => {
    try {
      const { error } = await supabase
        .from('content_blocks')
        .update({ active: !block.active })
        .eq('id', block.id);

      if (error) throw error;
      toast.success(`Content block ${block.active ? 'deactivated' : 'activated'}`);
      fetchBlocks();
    } catch (err) {
      console.error('Failed to toggle content block:', err);
      toast.error('Failed to update content block');
    }
  };

  const handleDelete = async (block: ContentBlock) => {
    if (!confirm(`Delete content block "${block.title}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('content_blocks')
        .delete()
        .eq('id', block.id);

      if (error) throw error;
      toast.success('Content block deleted');
      fetchBlocks();
    } catch (err) {
      console.error('Failed to delete content block:', err);
      toast.error('Failed to delete content block');
    }
  };

  const getLanguageBadge = (lang: string) => {
    switch (lang) {
      case 'en': return <Badge variant="outline">English</Badge>;
      case 'ne': return <Badge variant="outline" className="border-amber-500 text-amber-500">नेपाली</Badge>;
      default: return <Badge variant="outline">{lang}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'text': return <Badge variant="secondary">Text</Badge>;
      case 'prompt': return <Badge className="bg-purple-500">Prompt</Badge>;
      case 'html': return <Badge className="bg-blue-500">HTML</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">Manage app text, prompts, and messages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBlocks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleOpenEdit()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Blocks
          </CardTitle>
          <CardDescription>Edit app text, welcome messages, and AI prompts</CardDescription>
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
                  <TableHead>Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow key={block.id} className={!block.active ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-sm">{block.key}</TableCell>
                    <TableCell>{block.title}</TableCell>
                    <TableCell>{getLanguageBadge(block.language)}</TableCell>
                    <TableCell>{getTypeBadge(block.content_type)}</TableCell>
                    <TableCell>
                      {block.active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(block)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(block)}>
                          <Switch checked={block.active} className="pointer-events-none" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(block)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
            <DialogTitle>{editDialog.isNew ? 'Create Content Block' : 'Edit Content Block'}</DialogTitle>
            <DialogDescription>Configure app content and messaging</DialogDescription>
          </DialogHeader>

          {editDialog.block && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Key (unique identifier)</Label>
                  <Input
                    value={editDialog.block.key || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      block: { ...editDialog.block!, key: e.target.value }
                    })}
                    placeholder="welcome_message_en"
                    disabled={!editDialog.isNew}
                  />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editDialog.block.title || ''}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      block: { ...editDialog.block!, title: e.target.value }
                    })}
                    placeholder="Welcome Message"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Language</Label>
                  <Select
                    value={editDialog.block.language || 'en'}
                    onValueChange={(value) => setEditDialog({
                      ...editDialog,
                      block: { ...editDialog.block!, language: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ne">Nepali (नेपाली)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Content Type</Label>
                  <Select
                    value={editDialog.block.content_type || 'text'}
                    onValueChange={(value) => setEditDialog({
                      ...editDialog,
                      block: { ...editDialog.block!, content_type: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="prompt">AI Prompt</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  value={editDialog.block.content || ''}
                  onChange={(e) => setEditDialog({
                    ...editDialog,
                    block: { ...editDialog.block!, content: e.target.value }
                  })}
                  rows={6}
                  placeholder="Enter content here..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editDialog.block.active ?? true}
                  onCheckedChange={(checked) => setEditDialog({
                    ...editDialog,
                    block: { ...editDialog.block!, active: checked }
                  })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, block: null, isNew: false })}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editDialog.isNew ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
