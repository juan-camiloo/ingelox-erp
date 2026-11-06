import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { email } = await req.json();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return jsonResponse({ error: "El correo es requerido" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Blindaje de seguridad: Solo usuarios internos y activos
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_internal, status")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (!profile || profile.status === "inactive" || !profile.is_internal) {
      return jsonResponse({ 
        error: "Acceso denegado: Este correo no cuenta con privilegios operativos en Ingelox ERP." 
      }, 403);
    }

    // 2. Generar el código OTP oficial en Supabase (6 dígitos)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      throw linkError || new Error("No se pudo generar el código de acceso.");
    }

    const otpCode = linkData.properties.email_otp;
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    // 3. Enviar correo corporativo Ingelox ERP
    await resend.emails.send({
      from: "Ingelox ERP <operaciones@ingelox.com.co>",
      to: cleanEmail,
      subject: `[INGELOX ERP] Clave de Acceso: ${otpCode}`,
      html: `
      <!doctype html>
      <html lang="es">
      <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1E293B;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background-color:#0F172A;padding:24px 28px;border-bottom:3px solid #F35815;">
                    <span style="font-size:20px;font-weight:800;color:#FFFFFF;text-transform:uppercase;">
                      INGELOX <span style="font-size:11px;color:#F35815;background-color:#1E293B;padding:3px 8px;border-radius:4px;border:1px solid #334155;margin-left:6px;">ERP</span>
                    </span>
                    <div style="font-size:11px;color:#94A3B8;margin-top:4px;text-transform:uppercase;">Torre de Control & Operaciones</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 24px 28px;">
                    <h2 style="margin:0 0 12px 0;font-size:17px;color:#0F172A;">Código de Acceso a Workstation</h2>
                    <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.5;">Ingresa el siguiente código de 6 dígitos para validar tu identidad en la plataforma operativa:</p>
                    <div style="background-color:#F8FAFC;border:2px dashed #CBD5E1;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
                      <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#0F172A;font-family:monospace;">${otpCode}</span>
                    </div>
                    <p style="margin:0;font-size:12px;color:#94A3B8;">Este código expirará en 10 minutos. No compartas esta clave con nadie.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px;text-align:center;font-size:11px;color:#64748B;">
                    Ingelox Logistics SAS • Comunicado operativo confidencial
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`,
    });

    return jsonResponse({ success: true, message: "Código de ERP enviado exitosamente." });
  } catch (err: any) {
    console.error("Error en send-erp-otp:", err);
    return jsonResponse({ error: err.message || "Error al procesar solicitud" }, 500);
  }
});