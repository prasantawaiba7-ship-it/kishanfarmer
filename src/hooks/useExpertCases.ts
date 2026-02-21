import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface ExpertCase {
  id: string;
  farmer_id: string | null;
  farmer_phone: string | null;
  crop: string | null;
  problem_type: string | null;
  district: string | null;
  channel: string | null;
  priority: string | null;
  status: string | null;
  ai_summary: any;
  assigned_expert_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  case_id: string;
  sender_type: string | null;
  message: string | null;
  attachments: any;
  created_at: string;
}

// Farmer's own cases from the new `cases` table
export function useMyExpertCases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-expert-cases', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cases')
        .select('*')
        .eq('farmer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ExpertCase[];
    },
    enabled: !!user,
  });
}

// Messages for a specific case
export function useTicketMessages(caseId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ticket-messages', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await (supabase as any)
        .from('ticket_messages')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TicketMessage[];
    },
    enabled: !!caseId,
  });

  // Realtime
  useEffect(() => {
    if (!caseId) return;
    const channel = supabase
      .channel(`ticket-messages-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `case_id=eq.${caseId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', caseId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId, queryClient]);

  return query;
}

// Submit a new case to the `cases` table
export function useSubmitExpertCase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      crop: string;
      problemType?: string;
      district?: string;
      priority?: string;
      channel?: string;
      farmerPhone?: string;
      aiSummary?: any;
      description?: string;
      imageUrls?: string[];
    }) => {
      // Insert case
      const { data: caseData, error: caseError } = await (supabase as any)
        .from('cases')
        .insert({
          farmer_id: user?.id || null,
          farmer_phone: data.farmerPhone || null,
          crop: data.crop,
          problem_type: data.problemType || null,
          district: data.district || null,
          channel: data.channel || 'app',
          priority: data.priority || 'low',
          status: 'new',
          ai_summary: data.aiSummary || null,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Insert first message
      if (data.description || (data.imageUrls && data.imageUrls.length > 0)) {
        const attachments = (data.imageUrls || []).map((url: string) => ({ type: 'image', url }));
        await (supabase as any).from('ticket_messages').insert({
          case_id: caseData.id,
          sender_type: 'farmer',
          message: data.description || 'फोटो सहित प्रश्न पठाइएको छ।',
          attachments: attachments.length > 0 ? attachments : null,
        });
      }

      // Try auto-routing via the triage function
      try {
        await supabase.rpc('auto_route_ticket' as any, { p_case_id: caseData.id });
      } catch (e) {
        console.warn('Auto-routing skipped:', e);
      }

      return caseData as ExpertCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expert-cases'] });
      toast({
        title: '✅ प्रश्न पठाइयो',
        description: 'तपाईंको प्रश्न कृषि विज्ञलाई पठाइएको छ।',
      });
    },
    onError: (error) => {
      console.error('Failed to submit case:', error);
      toast({
        title: 'त्रुटि',
        description: 'प्रश्न पठाउन सकिएन।',
        variant: 'destructive',
      });
    },
  });
}

// Send a follow-up message
export function useSendTicketMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      caseId: string;
      message: string;
      senderType?: string;
      attachments?: any[];
    }) => {
      const { error } = await (supabase as any)
        .from('ticket_messages')
        .insert({
          case_id: data.caseId,
          sender_type: data.senderType || 'farmer',
          message: data.message,
          attachments: data.attachments || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', vars.caseId] });
      queryClient.invalidateQueries({ queryKey: ['my-expert-cases'] });
    },
    onError: () => {
      toast({ title: 'सन्देश पठाउन सकिएन', variant: 'destructive' });
    },
  });
}
