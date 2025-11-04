import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to add delay for rate limiting (Resend free tier: 2 emails/second)
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to send email via Resend API
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nordiska Schemaläggare <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

// Helper function to get ISO week number
function getISOWeek(date: Date): { week: number; year: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { week: weekNumber, year: target.getFullYear() };
}

// Get next week's ISO week number
function getNextWeek(): { week: number; year: number } {
  const now = new Date();
  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7;
  nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  return getISOWeek(nextMonday);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting schedule reminder job...");

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const nextWeek = getNextWeek();
    
    console.log(`Checking schedules for week ${nextWeek.week}, year ${nextWeek.year}`);

    // Fetch all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email');

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users to check`);

    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsSkipped = 0;
    const errors: string[] = [];
    
    console.log(`Starting to process ${profiles?.length || 0} users at ${new Date().toISOString()}`);

    // Check each user and send reminder if needed
    for (const profile of profiles || []) {
      try {
        // Check if user has filled in any status for next week
        const { data: schedules, error: scheduleError } = await supabase
          .from('employee_schedules')
          .select('id')
          .eq('user_id', profile.id)
          .eq('week_number', nextWeek.week)
          .eq('year', nextWeek.year)
          .limit(1);

        if (scheduleError) {
          console.error(`Error checking schedule for user ${profile.email}:`, scheduleError);
          errors.push(`${profile.email}: ${scheduleError.message}`);
          continue;
        }

        // If user has no schedules for next week, send reminder
        if (!schedules || schedules.length === 0) {
          console.log(`Sending reminder to ${profile.email} for week ${nextWeek.week}`);
          
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Hej ${profile.name}!</h1>
              <p style="font-size: 16px; line-height: 1.5;">
                Detta är en påminnelse om att fylla i din närvaro för vecka ${nextWeek.week}, ${nextWeek.year}.
              </p>
              <p style="font-size: 16px; line-height: 1.5;">
                Vänligen logga in och uppdatera ditt schema så snart som möjligt.
              </p>
              <div style="margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Fyll i schema
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Med vänliga hälsningar,<br>
                Nordiska Schemaläggare
              </p>
            </div>
          `;

          try {
            await sendEmail(
              profile.email,
              `Påminnelse: Fyll i din närvaro för vecka ${nextWeek.week}`,
              html
            );
            console.log(`[${new Date().toISOString()}] Successfully sent reminder to ${profile.email}`);
            emailsSent++;
            
            // Rate limiting: Wait 500ms between emails to respect Resend free tier (2 emails/second)
            await sleep(500);
          } catch (emailError: any) {
            console.error(`Failed to send email to ${profile.email}:`, emailError);
            emailsFailed++;
            errors.push(`${profile.email}: ${emailError.message}`);
          }
        } else {
          console.log(`User ${profile.email} has already filled in week ${nextWeek.week}`);
          emailsSkipped++;
        }
      } catch (error: any) {
        console.error(`Error processing user ${profile.email}:`, error);
        emailsFailed++;
        errors.push(`${profile.email}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      nextWeek,
      totalUsers: profiles?.length || 0,
      emailsSent,
      emailsFailed,
      emailsSkipped,
      errors: errors.length > 0 ? errors : undefined,
      completedAt: new Date().toISOString(),
    };

    console.log("Reminder job completed:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-schedule-reminder function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
