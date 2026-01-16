import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Users, TrendingUp, DollarSign, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';

interface SubscriptionData {
  id: string;
  user_id: string;
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
  queries_used: number;
  queries_limit: number;
  current_period_end: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface SubscriptionStats {
  totalSubscribers: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
  freeUsers: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

export const SubscriptionAnalytics = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscribers: 0,
    monthlySubscribers: 0,
    yearlySubscribers: 0,
    freeUsers: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Fetch all subscriptions
      const { data: subs, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles to get names
      const { data: profiles } = await supabase
        .from('farmer_profiles')
        .select('user_id, full_name');

      const subsWithNames = (subs || []).map(sub => ({
        ...sub,
        user_name: profiles?.find(p => p.user_id === sub.user_id)?.full_name || 'Unknown'
      }));

      setSubscriptions(subsWithNames);

      // Calculate stats
      const monthly = subsWithNames.filter(s => s.plan === 'monthly' && s.status === 'active');
      const yearly = subsWithNames.filter(s => s.plan === 'yearly' && s.status === 'active');
      const free = subsWithNames.filter(s => s.plan === 'free');

      setStats({
        totalSubscribers: monthly.length + yearly.length,
        monthlySubscribers: monthly.length,
        yearlySubscribers: yearly.length,
        freeUsers: free.length,
        monthlyRevenue: monthly.length * SUBSCRIPTION_PLANS.monthly.price,
        yearlyRevenue: yearly.length * SUBSCRIPTION_PLANS.yearly.price
      });
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'monthly':
        return <Badge className="bg-amber-500">Monthly</Badge>;
      case 'yearly':
        return <Badge className="bg-purple-500">Yearly</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                <p className="text-sm text-muted-foreground">Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.monthlySubscribers}</p>
                <p className="text-sm text-muted-foreground">Monthly Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.yearlySubscribers}</p>
                <p className="text-sm text-muted-foreground">Yearly Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">रु. {stats.monthlyRevenue + stats.yearlyRevenue}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribers</span>
                <span className="font-medium">{stats.monthlySubscribers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">रु. {SUBSCRIPTION_PLANS.monthly.price}/month</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Monthly Total</span>
                <span className="font-bold text-primary">रु. {stats.monthlyRevenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Yearly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribers</span>
                <span className="font-medium">{stats.yearlySubscribers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">रु. {SUBSCRIPTION_PLANS.yearly.price}/year</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Yearly Total</span>
                <span className="font-bold text-primary">रु. {stats.yearlyRevenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                All Subscriptions
              </CardTitle>
              <CardDescription>Manage user subscriptions and view usage</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubscriptions} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queries Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {sub.user_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium">{sub.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <span className={sub.queries_used >= sub.queries_limit ? 'text-destructive' : ''}>
                          {sub.queries_used} / {sub.plan === 'free' ? sub.queries_limit : '∞'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end 
                          ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        {format(new Date(sub.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
