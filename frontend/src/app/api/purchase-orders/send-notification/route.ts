import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Tipos para la notificación
interface NotificationPayload {
  numeroOrden: string;
  proveedorId: number;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  productos: Array<{
    producto: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  total: number;
  fecha?: string;
  descripcion?: string;
}

interface NotificationResult {
  success: boolean;
  channel: "whatsapp" | "email" | "both";
  payload: object;
}

// Configuración del transportador de nodemailer
// Configura estas variables de entorno en .env.local
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  // Si no hay configuración SMTP, usar modo simulación
  if (!user || !pass) {
    console.log("⚠️ SMTP no configurado - usando modo simulación");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

// Función para enviar correo electrónico
async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    // Si no hay transporter configurado, simular envío
    if (!transporter) {
      // Simulación: solo registrar en consola
      console.log("========== CORREO ELECTRÓNICO (SIMULADO) ==========");
      console.log("Para:", to);
      console.log("Asunto:", subject);
      console.log("Contenido disponible en la consola anterior");
      console.log("=====================================================");
      return true;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    const info = await transporter.sendMail({
      from: `"Sistema de Compras" <${from}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log("✅ Correo enviado exitosamente:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return false;
  }
}

// Función para enviar notificación por WhatsApp
async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    console.log("========== WHATSAPP NOTIFICATION ==========");
    console.log("Teléfono:", phone);
    console.log("Mensaje:", message);
    console.log("============================================");
    
    // En un ambiente real, aquí integrarías con la API de WhatsApp
    // usando Meta Cloud API, Twilio, o algún otro proveedor
    /*
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      })
    });
    */
    
    return true;
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    return false;
  }
}

// Generar contenido HTML para el correo
function generateEmailHTML(payload: NotificationPayload): string {
  const productosHTML = payload.productos
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.producto}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.cantidad}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${p.precioUnitario.toLocaleString("es-CO")}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(p.cantidad * p.precioUnitario).toLocaleString("es-CO")}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #eee; padding: 10px; text-align: left; }
        .total { font-size: 18px; font-weight: bold; color: #10b981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nueva Orden de Compra</h1>
        </div>
        <div class="content">
          <p>Estimado proveedor,</p>
          <p>Se ha creado una nueva orden de compra a su nombre. A continuación los detalles:</p>
          
          <h3>Información de la Orden</h3>
          <p><strong>Número de Orden:</strong> ${payload.numeroOrden}</p>
          <p><strong>Fecha:</strong> ${payload.fecha || new Date().toLocaleDateString("es-CO")}</p>
          ${payload.descripcion ? `<p><strong>Descripción:</strong> ${payload.descripcion}</p>` : ""}
          
          <h3>Productos Solicitados</h3>
          <table>
            <thead>
              <tr>
                <th style="padding: 10px;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cantidad</th>
                <th style="padding: 10px; text-align: right;">P. Unitario</th>
                <th style="padding: 10px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productosHTML}
            </tbody>
          </table>
          
          <p style="text-align: right; margin-top: 20px;" class="total">
            TOTAL: $${payload.total.toLocaleString("es-CO")}
          </p>
          
          <p style="margin-top: 30px;">
            Por favor confirme la recepción de esta orden y su disponibilidad de los productos solicitados.
          </p>
        </div>
        <div class="footer">
          <p>Este correo fue enviado automáticamente por el sistema de gestión de compras.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generar mensaje de texto para WhatsApp
function generateWhatsAppMessage(payload: NotificationPayload): string {
  const productosList = payload.productos
    .map((p) => `• ${p.producto}: ${p.cantidad} x $${p.precioUnitario.toLocaleString("es-CO")}`)
    .join("\n");

  return `🛒 *NUEVA ORDEN DE COMPRA*\n\n
*Número:* ${payload.numeroOrden}
*Fecha:* ${payload.fecha || new Date().toLocaleDateString("es-CO")}

*Productos:*
${productosList}

*Total:* $${payload.total.toLocaleString("es-CO")}

${payload.descripcion ? `\n*Nota:* ${payload.descripcion}\n` : ""}

Por favor confirme la recepción.`;
}

// POST handler para enviar notificaciones
export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json();

    // Validar datos requeridos
    if (!payload.numeroOrden || !payload.supplierName) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: numeroOrden y supplierName" },
        { status: 400 }
      );
    }

    // Determinar qué notificaciones enviar
    const sendEmail = !!payload.supplierEmail;
    const sendWhatsApp = !!payload.supplierPhone;

    if (!sendEmail && !sendWhatsApp) {
      const result: NotificationResult = {
        success: false,
        channel: "email",
        payload: {},
      };
      return NextResponse.json(result);
    }

    let emailSent = false;
    let whatsappSent = false;

    // Enviar correo electrónico
    if (sendEmail && payload.supplierEmail) {
      const emailSubject = `Nueva Orden de Compra #${payload.numeroOrden}`;
      const emailHTML = generateEmailHTML(payload);
      emailSent = await sendEmailNotification(
        payload.supplierEmail,
        emailSubject,
        emailHTML
      );
    }

    // Enviar WhatsApp
    if (sendWhatsApp && payload.supplierPhone) {
      const whatsappMessage = generateWhatsAppMessage(payload);
      // Limpiar número de teléfono (quitar espacios, guiones, etc.)
      const cleanPhone = payload.supplierPhone.replace(/[\s\-()]/g, "");
      whatsappSent = await sendWhatsAppNotification(cleanPhone, whatsappMessage);
    }

    // Determinar el canal exitoso
    let channel: "whatsapp" | "email" | "both" = "email";
    if (emailSent && whatsappSent) {
      channel = "both";
    } else if (whatsappSent) {
      channel = "whatsapp";
    }

    const result: NotificationResult = {
      success: emailSent || whatsappSent,
      channel,
      payload: {
        emailSent,
        whatsappSent,
        orderNumber: payload.numeroOrden,
        supplierName: payload.supplierName,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en notificación:", error);
    return NextResponse.json(
      { error: "Error al procesar la notificación" },
      { status: 500 }
    );
  }
}

