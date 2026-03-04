import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, Mail, Lock, User, Loader2, ArrowRight, Globe, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { lovable } from '@/integrations/lovable/index';

const authSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  useEffect(() => {
    if (user) {
      navigate('/krishi-mitra');
    }
  }, [user, navigate]);

  const handleSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    
    if (isNewUser) {
      const { error } = await signUp(data.email, data.password, data.fullName || 'Farmer');
      setIsLoading(false);
      
      if (error) {
        if (error.message.includes('already registered')) {
          form.setError('email', { message: language === 'ne' ? 'यो ईमेल पहिलेनै दर्ता भइसकेको छ।' : 'This email is already registered.' });
        } else {
          form.setError('root', { message: error.message });
        }
      }
    } else {
      const { error } = await signIn(data.email, data.password);
      setIsLoading(false);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          form.setError('root', { message: language === 'ne' ? 'ईमेल वा पासवर्ड गलत छ।' : 'Invalid email or password.' });
        } else {
          form.setError('root', { message: error.message });
        }
      }
    }
  };

  const toggleLanguage = () => setLanguage(language === 'ne' ? 'en' : 'ne');

  return (
    <>
      <Helmet>
        <title>{language === 'ne' ? 'लगइन — किसान साथी' : 'Login — Kisan Sathi'}</title>
        <meta name="description" content="Sign in to access your farming dashboard." />
      </Helmet>

      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(170deg, hsl(150 40% 96%) 0%, hsl(30 60% 97%) 50%, hsl(44 40% 96%) 100%)' }}>
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        {/* Top bar with language switch */}
        <div className="flex justify-between items-center p-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">किसान साथी</span>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 border border-border/50 text-xs font-semibold text-foreground hover:bg-background transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'ne' ? 'EN' : 'नेपाली'}
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg">
                <Sprout className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isNewUser
                  ? (language === 'ne' ? 'नयाँ खाता बनाउनुहोस्' : 'Create Account')
                  : (language === 'ne' ? 'किसान लगइन' : 'Farmer Login')
                }
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isNewUser
                  ? (language === 'ne' ? 'आफ्नो खेती ड्यासबोर्ड सुरु गर्नुहोस्' : 'Start your farming dashboard')
                  : (language === 'ne' ? 'तपाईंको खेती ड्यासबोर्डमा प्रवेश गर्नुहोस्' : 'Access your farming dashboard')
                }
              </p>
            </div>

            {/* Card */}
            <div className="bg-card/95 backdrop-blur-sm rounded-3xl border border-border/40 shadow-xl p-5 sm:p-6 space-y-4">
              {/* Google Sign-In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-13 text-base font-medium rounded-2xl gap-3 border-2 border-border/60 hover:border-primary/30 hover:bg-primary/5"
                disabled={isGoogleLoading}
                onClick={async () => {
                  setIsGoogleLoading(true);
                  setGoogleError(null);
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (result.error) {
                    setGoogleError(language === 'ne' ? 'Google साइन-इन असफल भयो, फेरि प्रयास गर्नुहोस्।' : 'Google sign-in failed, please try again.');
                    setIsGoogleLoading(false);
                  }
                }}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {language === 'ne' ? 'Google बाट लगइन गर्नुहोस्' : 'Continue with Google'}
                  </>
                )}
              </Button>

              {googleError && (
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{googleError}</p>
              )}

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{language === 'ne' ? 'वा इमेलले' : 'or with email'}</span>
                <Separator className="flex-1" />
              </div>

              {/* Email/Password Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3.5">
                  <AnimatePresence>
                    {isNewUser && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ne' ? 'पूरा नाम' : 'Full Name'}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder={language === 'ne' ? 'तपाईंको नाम' : 'Your name'} className="pl-10 h-12 text-base rounded-xl bg-background/60 border-border/50 focus:border-primary/40" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ne' ? 'इमेल' : 'Email'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder={language === 'ne' ? 'इमेल हाल्नुहोस्' : 'Enter email'} className="pl-10 h-12 text-base rounded-xl bg-background/60 border-border/50 focus:border-primary/40" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ne' ? 'पासवर्ड' : 'Password'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder={language === 'ne' ? 'पासवर्ड हाल्नुहोस्' : 'Enter password'} className="pl-10 h-12 text-base rounded-xl bg-background/60 border-border/50 focus:border-primary/40" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <Button type="submit" className="w-full h-13 text-base font-semibold rounded-2xl shadow-md" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {isNewUser 
                          ? (language === 'ne' ? 'खाता बनाउनुहोस्' : 'Create Account')
                          : (language === 'ne' ? 'लगइन गर्नुहोस्' : 'Login')
                        }
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Toggle login/signup */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-sm font-semibold text-primary hover:underline underline-offset-2"
                >
                  {isNewUser
                    ? (language === 'ne' ? '← पहिलेनै खाता छ? लगइन गर्नुहोस्' : '← Already have an account? Login')
                    : (language === 'ne' ? 'नयाँ खाता बनाउनुहोस् →' : 'Create new account →')
                  }
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-5 px-4">
              {language === 'ne' 
                ? 'अगाडि बढ्दा, तपाईंले सेवा सर्तहरू र गोपनीयता नीतिमा सहमति जनाउनुहुन्छ।'
                : "By continuing, you agree to our Terms of Service and Privacy Policy."
              }
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Auth;
