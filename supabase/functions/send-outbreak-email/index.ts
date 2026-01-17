import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutbreakEmailRequest {
  alertId: string;
  diseaseName: string;
  district: string;
  state: string;
  detectionCount: number;
  severity: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { alertId, diseaseName, district, state, detectionCount, severity }: OutbreakEmailRequest = await req.json();

    console.log(`Processing outbreak email for: ${diseaseName} in ${district}`);

    // Get farmers in the affected area with email notifications enabled
    const { data: farmers, error: farmersError } = await supabase
      .from('farmer_profiles')
      .select(`
        id,
        full_name,
        user_id,
        district,
        state
      `)
      .or(`district.eq.${district},state.eq.${state}`);

    if (farmersError) {
      console.error('Error fetching farmers:', farmersError);
      throw farmersError;
    }

    if (!farmers || farmers.length === 0) {
      console.log('No farmers found in the affected area');
      return new Response(
        JSON.stringify({ message: 'No farmers to notify' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user emails from auth.users
    const userIds = farmers.map(f => f.user_id);
    const { data: authData } = await supabase.auth.admin.listUsers();
    
    const userEmails = new Map<string, string>();
    authData?.users.forEach(user => {
      if (userIds.includes(user.id) && user.email) {
        userEmails.set(user.id, user.email);
      }
    });

    // Check notification preferences
    const farmerIds = farmers.map(f => f.id);
    const { data: preferences } = await supabase
      .from('farmer_notification_preferences')
      .select('farmer_id, email_enabled, outbreak_alerts')
      .in('farmer_id', farmerIds);

    const prefsMap = new Map(preferences?.map(p => [p.farmer_id, p]) || []);

    // Filter farmers who have email notifications enabled
    const recipientFarmers = farmers.filter(farmer => {
      const prefs = prefsMap.get(farmer.id);
      // Default to true if no preferences set
      const emailEnabled = prefs?.email_enabled ?? true;
      const outbreakAlertsEnabled = prefs?.outbreak_alerts ?? true;
      return emailEnabled && outbreakAlertsEnabled;
    });

    console.log(`Sending emails to ${recipientFarmers.length} farmers`);

    // Severity labels in Nepali
    const severityLabels: Record<string, string> = {
      high: 'गम्भीर',
      medium: 'मध्यम',
      low: 'सामान्य',
    };

    const severityColors: Record<string, string> = {
      high: '#dc2626',
      medium: '#f59e0b',
      low: '#10b981',
    };

    let successCount = 0;
    let errorCount = 0;

    // Send emails to each farmer
    for (const farmer of recipientFarmers) {
      const email = userEmails.get(farmer.user_id);
      if (!email) continue;

      const isLocalDistrict = farmer.district === district;

      try {
        const emailResponse = await resend.emails.send({
          from: "KrishiMitra Nepal <onboarding@resend.dev>",
          to: [email],
          subject: `⚠️ रोग प्रकोप चेतावनी: ${diseaseName} - ${district}`,
          html: `
            <!DOCTYPE html>
            <html lang="ne">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🌿 कृषि मित्र नेपाल</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">रोग प्रकोप चेतावनी प्रणाली</p>
                </div>
                
                <!-- Alert Banner -->
                <div style="background-color: ${severityColors[severity] || severityColors.medium}; padding: 20px; text-align: center;">
                  <h2 style="color: white; margin: 0; font-size: 20px;">⚠️ रोग प्रकोप चेतावनी!</h2>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                  <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                    नमस्ते ${farmer.full_name},
                  </p>
                  
                  ${isLocalDistrict ? `
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="color: #dc2626; margin: 0; font-weight: bold;">
                      ⚠️ तपाईंको जिल्लामा रोग प्रकोप पहिचान भएको छ!
                    </p>
                  </div>
                  ` : ''}
                  
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280;">रोगको नाम:</strong>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          <strong style="color: #111827;">${diseaseName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280;">स्थान:</strong>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          ${district}, ${state}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280;">रिपोर्ट संख्या:</strong>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                          ${detectionCount} किसानले रिपोर्ट गरे
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <strong style="color: #6b7280;">गम्भीरता:</strong>
                        </td>
                        <td style="padding: 10px 0; text-align: right;">
                          <span style="background-color: ${severityColors[severity]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                            ${severityLabels[severity] || severity}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <h3 style="color: #16a34a; margin-bottom: 15px;">🛡️ सावधानीका उपायहरू:</h3>
                  <ul style="color: #374151; padding-left: 20px;">
                    <li style="margin-bottom: 10px;">आफ्नो बालीको नियमित निरीक्षण गर्नुहोस्</li>
                    <li style="margin-bottom: 10px;">लक्षण देखिएमा तुरुन्त उपचार गर्नुहोस्</li>
                    <li style="margin-bottom: 10px;">संक्रमित बिरुवा हटाउनुहोस्</li>
                    <li style="margin-bottom: 10px;">नजिकको कृषि केन्द्रमा सम्पर्क गर्नुहोस्</li>
                  </ul>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://krishi-mitra.lovable.app/disease-detection" 
                       style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      🌿 बाली जाँच गर्नुहोस्
                    </a>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    यो इमेल कृषि मित्र नेपालको रोग प्रकोप चेतावनी प्रणालीबाट स्वचालित रूपमा पठाइएको हो।
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                    © 2024 कृषि मित्र - नेपाल
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailResponse.error) {
          console.error(`Failed to send email to ${email}:`, emailResponse.error);
          errorCount++;
        } else {
          console.log(`Email sent to ${email}`);
          successCount++;
        }
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        errorCount++;
      }
    }

    // Log the notification activity
    await supabase
      .from('activity_logs')
      .insert({
        action: 'outbreak_email_sent',
        entity_type: 'disease_outbreak_alerts',
        entity_id: alertId,
        details: {
          disease: diseaseName,
          district,
          state,
          emails_sent: successCount,
          emails_failed: errorCount,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: successCount,
        emailsFailed: errorCount,
        totalRecipients: recipientFarmers.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-outbreak-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
