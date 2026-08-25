// =========================================================
// FORMULARIO DE CONTACTO
//
// Envía los datos del formulario de la sección "Contacto" al backend
// desplegado en Cloudflare Workers. Valida en el propio navegador antes
// de llamar al backend para evitar peticiones innecesarias.
// =========================================================

const CONTACT_FORM_ENDPOINT = 'https://chatbot-backend.albertlopezespinosa.workers.dev/contact';

const formulario = document.getElementById('contacto-form');
const campoNombre = document.getElementById('contacto-nombre');
const campoEmail = document.getElementById('contacto-email');
const campoTelefono = document.getElementById('contacto-telefono');
const campoMensaje = document.getElementById('contacto-mensaje');
const botonEnviar = formulario.querySelector('.contacto__form-enviar');
const estado = document.getElementById('contacto-form-estado');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Muestra un mensaje de estado bajo el botón de envío ("exito" o "error")
function mostrarEstado(mensaje, tipo) {
  estado.textContent = mensaje;
  estado.className = 'contacto__form-estado contacto__form-estado--' + tipo;
}

function limpiarEstado() {
  estado.textContent = '';
  estado.className = 'contacto__form-estado';
}

// Validación básica en el frontend antes de llamar al backend: campos
// obligatorios no vacíos y formato de email
function validarFormulario() {
  const nombre = campoNombre.value.trim();
  const email = campoEmail.value.trim();
  const mensaje = campoMensaje.value.trim();

  if (!nombre || !email || !mensaje) {
    return 'Por favor, rellena los campos obligatorios (nombre, email y mensaje).';
  }

  if (!REGEX_EMAIL.test(email)) {
    return 'Introduce un email con un formato válido.';
  }

  return null;
}

async function enviarFormulario(evento) {
  evento.preventDefault();
  limpiarEstado();

  const errorValidacion = validarFormulario();
  if (errorValidacion) {
    mostrarEstado(errorValidacion, 'error');
    return;
  }

  const datos = {
    name: campoNombre.value.trim(),
    email: campoEmail.value.trim(),
    phone: campoTelefono.value.trim(),
    message: campoMensaje.value.trim()
  };

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Enviando...';

  try {
    const respuesta = await fetch(CONTACT_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok || !cuerpo.success) {
      throw new Error(cuerpo.error || 'No se ha podido enviar el mensaje.');
    }

    mostrarEstado('¡Mensaje enviado! Te responderé lo antes posible.', 'exito');
    formulario.reset();
  } catch (error) {
    // El backend devuelve mensajes de error ya pensados para el usuario
    // (incluido el aviso de límite de peticiones), así que se muestran
    // tal cual en vez de un texto genérico
    mostrarEstado(error.message, 'error');
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = 'Enviar mensaje';
  }
}

formulario.addEventListener('submit', enviarFormulario);
