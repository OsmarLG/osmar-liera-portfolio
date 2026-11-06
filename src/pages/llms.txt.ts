import type { APIRoute } from 'astro';
import { SITE_URL, person } from '../i18n/profile';
import { company, socialProfiles } from '../i18n/social';
import { categoryLabels, getPosts, postPath } from '../lib/blog';

/** llms.txt, generated at build time so the blog section lists the published posts. */
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const abs = (path: string): string => new URL(path, SITE_URL).href;

  const blog =
    posts.length > 0
      ? posts.map((post) => `- [${post.data.title}](${abs(postPath(post))}) (${categoryLabels[post.data.category]}): ${post.data.description}`).join('\n')
      : '- Todavía no hay artículos publicados.';

  const text = `# Osmar Liera — Marketing y tecnología para negocios

> Osmar Alejandro Liera Gómez (Osmar Liera) es consultor en marketing y tecnología en La Paz, Baja California Sur, México. Diagnostica el negocio, recomienda qué hacer primero y lo implementa él mismo: redes sociales, páginas web, tiendas en línea, automatización e IA, y sistemas a la medida. Ingeniero en Sistemas Computacionales con 4 años de experiencia profesional en software en producción.

Sitio en español (principal) con portafolio en inglés. Su CV completo sigue disponible en ${abs('/cv/')}.

## Para quién trabaja

- Pymes de La Paz y Los Cabos (Baja California Sur) que ya venden pero no tienen estrategia digital ni procesos ordenados: restaurantes, inmobiliarias, constructoras, comercios, tiendas en línea y servicios.
- Diferencia: un community manager no programa y un programador no entiende de marketing; Osmar hace las dos cosas y el cliente trata con una sola persona de principio a fin.

## Servicios

1. Diagnóstico Digital (para empezar): sesión de 60 a 90 minutos con el dueño; revisión de redes, sitio web, proceso de venta y herramientas; entrega en una semana de un plan de acción de 1 a 2 páginas con 3 a 5 prioridades. Si se contrata una implementación en los siguientes 30 días, el diagnóstico se descuenta.
2. Implementaciones (alcance cerrado):
   - Redes que venden: manejo de Instagram y Facebook (calendario, diseño, textos, respuesta a comentarios y mensajes, reporte mensual).
   - Presencia web: landing page o sitio con formulario y WhatsApp conectado.
   - Tienda en línea: con pagos, catálogo y conexión a redes.
   - Automatización: respuestas automáticas a mensajes, prospectos de redes a un CRM u hoja, recordatorios y reportes.
   - Sistema a la medida: ERP, inventario, cotizador o panel administrativo.
3. Asesoría Mensual: revisión mensual de métricas y ventas, ajustes de estrategia y soporte a lo implementado; se puede combinar con el manejo de redes.

Precios: se cotizan por proyecto después del diagnóstico.

## Blog

${blog}

- [Todos los artículos](${abs('/blog/')})
- [RSS](${abs('/blog/rss.xml')})

## Experiencia (resumen de sus CV)

- Desarrollador Full-Stack en Nuts Marketing (2024 a la fecha): integraciones entre tiendas Shopify y ERPs Microsoft Dynamics 365, y las plataformas de Shasa (México y Estados Unidos) e Hypsters.
- Fundador y líder técnico de ${company.name} (${company.url}), estudio de software, integraciones e IA aplicada en La Paz.
- Desarrollador Full-Stack en Tangramx (Python / FastAPI): aplicaciones para aseguradoras, salud y logística; OCR con IA evaluado contra datos reales antes de liberarlo.
- Programador de sistemas institucionales y docente del último semestre de las carreras de desarrollo de software en el Instituto Tecnológico de La Paz.
- IA en producción: servidor MCP de OS CRM (23 herramientas) con permisos, auditoría y aprobación humana de los mensajes de WhatsApp; agentes con salidas estructuradas (JSON Schema).

## Páginas

- [Inicio y servicios](${abs('/')})
- [Blog](${abs('/blog/')})
- [CV (español)](${abs('/cv/')})
- [Résumé (English)](${abs('/en/cv/')})
- [Portfolio (English)](${abs('/en/')})
- [Aviso de privacidad](${abs('/privacidad/')})

## Contacto

- WhatsApp: ${person.phoneDisplay} (https://wa.me/${person.whatsappNumber})
- Correo: ${person.email}
${socialProfiles.map((profile) => `- ${profile.network}: ${profile.href}`).join('\n')}
- ${company.name}: ${company.url}
`;

  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
