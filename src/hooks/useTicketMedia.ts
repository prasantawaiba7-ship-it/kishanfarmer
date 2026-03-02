// Voice note + video attachment support for expert tickets
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MessageAttachment {
  id: string;
  message_id: string;
  ticket_id: string;
  uploaded_by: string;
  role: 'farmer' | 'technician';
  type: 'audio' | 'video';
  file_url: string;
  duration_seconds: number | null;
  created_at: string;
}

/** Fetch all media attachments for a ticket, grouped by message_id */
export function useTicketMedia(ticketId: string | null) {
  return useQuery({
    queryKey: ['ticket-media', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await (supabase as any)
        .from('expert_message_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MessageAttachment[];
    },
    enabled: !!ticketId,
  });
}

/** Upload media file to storage and insert attachment row */
export async function uploadTicketMedia(
  ticketId: string,
  messageId: string,
  file: Blob,
  type: 'audio' | 'video',
  uploadedBy: string,
  role: 'farmer' | 'technician',
  durationSeconds?: number,
): Promise<MessageAttachment> {
  const ext = type === 'audio' ? 'webm' : 'webm';
  const folder = type === 'audio' ? 'audio' : 'video';
  const path = `${folder}/${ticketId}/${messageId}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('ticket-media')
    .upload(path, file, { contentType: type === 'audio' ? 'audio/webm' : 'video/webm' });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage
    .from('ticket-media')
    .getPublicUrl(path);

  const { data, error } = await (supabase as any)
    .from('expert_message_attachments')
    .insert({
      message_id: messageId,
      ticket_id: ticketId,
      uploaded_by: uploadedBy,
      role,
      type,
      file_url: urlData.publicUrl,
      duration_seconds: durationSeconds || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as MessageAttachment;
}
