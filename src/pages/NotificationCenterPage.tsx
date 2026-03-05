import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  useAppNotifications,
  useAppNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from '@/hooks/useAppNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav';
import {
  ArrowLeft, Bell, CheckCheck, Cloud, Bug, TrendingUp, Sprout,
  Loader2, BellOff, Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type FilterType = 'all' | 'weather' | 'disease' | 'market' | 'tip' | 'ticket';

const FILTER_TABS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'सबै', icon: <Bell className="w-3.5 h-3.5" /> },
  { key: 'weather', label: 'मौसम', icon: <Cloud className="w-3.5 h-3.5" /> },
  { key: 'disease', label: 'रोग', icon: <Bug className="w-3.5 h-3.5" /> },
  { key: 'market', label: 'बजार', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: 'tip', label: 'सुझाव', icon: <Sprout className="w-3.5 h-3.5" /> },
];

function getNotifCategory(n: AppNotification): FilterType {
  const type = n.type?.toLowerCase() || '';
  const title = (n.title || '').toLowerCase();
  const body = (n.body || '').toLowerCase();

  if (type.includes('weather') || title.includes('मौसम') || title.includes('वर्षा') || title.includes('weather'))
    return 'weather';
  if (type.includes('disease') || type.includes('outbreak') || title.includes('रोग') || title.includes('प्रकोप'))
    return 'disease';
  if (type.includes('market') || type.includes('price') || title.includes('बजार') || title.includes('मूल्य'))
    return 'market';
  if (type.includes('tip') || type.includes('advice') || title.includes('सुझाव') || title.includes('tip'))
    return 'tip';
  if (type.includes('ticket') || type.includes('reply'))
    return 'ticket';
  return 'tip';
}

function getNotifIcon(category: FilterType) {
  switch (category) {
    case 'weather': return <Cloud className="w-5 h-5 text-blue-600" />;
    case 'disease': return <Bug className="w-5 h-5 text-red-500" />;
    case 'market': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    case 'tip': return <Sprout className="w-5 h-5 text-primary" />;
    case 'ticket': return <Bell className="w-5 h-5 text-amber-600" />;
    default: return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
}

function getNotifEmoji(category: FilterType) {
  switch (category) {
    case 'weather': return '🌦';
    case 'disease': return '🦠';
    case 'market': return '📈';
    case 'tip': return '🌱';
    case 'ticket': return '👨‍🌾';
    default: return '🔔';
  }
}

function getNotifBorderColor(category: FilterType) {
  switch (category) {
    case 'weather': return 'border-l-blue-500';
    case 'disease': return 'border-l-red-400';
    case 'market': return 'border-l-emerald-500';
    case 'tip': return 'border-l-primary';
    case 'ticket': return 'border-l-amber-500';
    default: return 'border-l-border';
  }
}

export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: notifications, isLoading } = useAppNotifications();
  const { data: unreadCount } = useAppNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { enablePushNotifications, isPushSupported } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  if (!user) { navigate('/auth'); return null; }

  const filteredNotifications = notifications?.filter(n => {
    if (activeFilter === 'all') return true;
    return getNotifCategory(n) === activeFilter;
  });

  const handleNotifClick = (n: AppNotification) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
    if (n.ticket_id) {
      navigate('/expert-questions');
    }
  };

  const categoryCountMap = notifications?.reduce((acc, n) => {
    const cat = getNotifCategory(n);
    if (!n.is_read) acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <>
      <Helmet>
        <title>सूचना केन्द्र - Kishan Sathi</title>
        <meta name="description" content="तपाईंको खेती सम्बन्धी महत्वपूर्ण सूचना" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-base font-bold text-foreground">🔔 सूचना केन्द्र</h1>
                  <p className="text-[10px] text-muted-foreground">महत्वपूर्ण खेती सम्बन्धी सूचना</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isPushSupported && (
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={enablePushNotifications} title="Push सूचना सक्षम">
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
                {!!unreadCount && unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    onClick={() => markAllRead.mutate()}
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" /> सबै पढेको
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="pb-28 container mx-auto px-4 max-w-2xl pt-4">
          {/* Unread Summary */}
          {!!unreadCount && unreadCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {unreadCount} नयाँ सूचना
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(categoryCountMap)
                        .filter(([, c]) => c > 0)
                        .map(([k, c]) => `${getNotifEmoji(k as FilterType)} ${c}`)
                        .join(' • ') || 'सबै पढिसकेको'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
            {FILTER_TABS.map(tab => {
              const count = tab.key === 'all'
                ? (unreadCount || 0)
                : (categoryCountMap[tab.key] || 0);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    activeFilter === tab.key
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeFilter === tab.key
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">लोड हुँदैछ...</p>
            </div>
          ) : filteredNotifications && filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNotifications.map((n, i) => {
                  const category = getNotifCategory(n);
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card
                        onClick={() => handleNotifClick(n)}
                        className={`cursor-pointer rounded-2xl border-l-4 transition-all hover:shadow-md active:scale-[0.98] ${
                          getNotifBorderColor(category)
                        } ${
                          !n.is_read
                            ? 'bg-primary/[0.03] shadow-sm border-border/60'
                            : 'border-border/30 opacity-80'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                              {getNotifIcon(category)}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-lg leading-none">{getNotifEmoji(category)}</span>
                                <h3 className={`text-sm font-bold truncate ${
                                  !n.is_read ? 'text-foreground' : 'text-muted-foreground'
                                }`}>
                                  {n.title}
                                </h3>
                                {!n.is_read && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0 shadow-lg shadow-primary/40" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {n.body}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-[11px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                </p>
                                {!n.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-primary hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markRead.mutate(n.id);
                                    }}
                                  >
                                    <CheckCheck className="w-3 h-3 mr-0.5" /> पढेको
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="rounded-2xl border-border/40">
              <CardContent className="py-16 text-center">
                <BellOff className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-1">
                  {activeFilter === 'all' ? 'कुनै सूचना छैन' : 'यो प्रकारको सूचना छैन'}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  नयाँ सूचना आएपछि यहाँ देखिनेछ
                </p>
                {isPushSupported && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={enablePushNotifications}
                  >
                    🔔 Push सूचना सक्षम गर्नुहोस्
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        <FarmerBottomNav />
      </div>
    </>
  );
}
