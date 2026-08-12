// =========================================================
// WIDGET DE CHAT FLOTANTE
//
// Burbuja fija que abre una ventana de chat conectada al backend
// desplegado en Cloudflare Workers. El historial de la conversación
// se guarda solo en memoria (array JS): se pierde al recargar la
// página, no hace falta persistencia entre visitas.
// =========================================================

const CHAT_WIDGET_ENDPOINT = 'https://chatbot-backend.albertlopezespinosa.workers.dev/chat';

const contenedor = document.querySelector('.chat-widget');
const botonToggle = document.getElementById('chat-widget-toggle');
const ventana = document.getElementById('chat-widget-ventana');
const listaMensajes = document.getElementById('chat-widget-mensajes');
const formulario = document.getElementById('chat-widget-form');
const input = document.getElementById('chat-widget-input');
const botonEnviar = formulario.querySelector('.chat-widget__enviar');

// Historial de la conversación, solo en memoria (no se persiste entre visitas)
const historial = [];
let esperandoRespuesta = false;

// Añade un mensaje al área de mensajes y hace scroll hasta el final.
// Devuelve el elemento creado, por si hay que quitarlo después (ver
// mostrarEscribiendo).
function agregarMensaje(texto, tipo) {
  const burbuja = document.createElement('div');
  burbuja.className = 'chat-widget__mensaje chat-widget__mensaje--' + tipo;
  burbuja.textContent = texto;
  listaMensajes.appendChild(burbuja);
  listaMensajes.scrollTop = listaMensajes.scrollHeight;
  return burbuja;
}

// Muestra el indicador de "escribiendo..." (3 puntos animados) mientras
// esperamos la respuesta del backend
function mostrarEscribiendo() {
  const burbuja = document.createElement('div');
  burbuja.className = 'chat-widget__mensaje chat-widget__mensaje--asistente';
  burbuja.innerHTML =
    '<span class="chat-widget__puntos">' +
    '<span class="chat-widget__punto"></span>' +
    '<span class="chat-widget__punto"></span>' +
    '<span class="chat-widget__punto"></span>' +
    '</span>';
  listaMensajes.appendChild(burbuja);
  listaMensajes.scrollTop = listaMensajes.scrollHeight;
  return burbuja;
}

// Abre o cierra la ventana de chat
function alternarVentana() {
  const abierta = contenedor.classList.toggle('chat-widget--abierto');
  ventana.hidden = !abierta;
  botonToggle.setAttribute('aria-expanded', String(abierta));
  botonToggle.setAttribute('aria-label', abierta ? 'Cerrar chat' : 'Abrir chat');

  if (abierta) {
    input.focus();
  }
}

// Envía el mensaje del usuario al backend y muestra la respuesta.
// Si el backend falla (límite de peticiones, error de red, etc.),
// mostramos un mensaje amigable en el chat en vez del error crudo.
async function enviarMensaje(evento) {
  evento.preventDefault();

  const texto = input.value.trim();
  if (!texto || esperandoRespuesta) return;

  agregarMensaje(texto, 'usuario');
  historial.push({ rol: 'usuario', texto: texto });
  input.value = '';

  esperandoRespuesta = true;
  botonEnviar.disabled = true;
  const indicadorEscribiendo = mostrarEscribiendo();

  try {
    const respuesta = await fetch(CHAT_WIDGET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: texto })
    });

    if (!respuesta.ok) {
      throw new Error('Respuesta no válida del backend: ' + respuesta.status);
    }

    const datos = await respuesta.json();
    indicadorEscribiendo.remove();
    agregarMensaje(datos.reply, 'asistente');
    historial.push({ rol: 'asistente', texto: datos.reply });
  } catch (error) {
    indicadorEscribiendo.remove();
    agregarMensaje(
      'Ahora mismo no puedo responder (puede que se haya alcanzado el límite de peticiones). Inténtalo de nuevo en unos minutos.',
      'error'
    );
  } finally {
    esperandoRespuesta = false;
    botonEnviar.disabled = false;
  }
}

// Mensaje de bienvenida inicial del asistente
agregarMensaje(
  '¡Hola! Pregúntame lo que quieras sobre la experiencia, aptitudes o proyectos de Albert.',
  'asistente'
);

botonToggle.addEventListener('click', alternarVentana);
formulario.addEventListener('submit', enviarMensaje);
