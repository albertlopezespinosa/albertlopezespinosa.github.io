// =========================================================
// ASISTENTE: TERMINAL DEL HERO + MINI TERMINAL FLOTANTE
//
// Hay un único "núcleo" de chat y dos "vistas" que lo dibujan:
//
//   NÚCLEO (uno solo)
//     - historial: array en memoria con las líneas de la conversación
//       (se pierde al recargar la página; no hace falta persistencia)
//     - enviar(texto): resuelve los comandos locales (help, clear) o
//       manda la pregunta al backend (/chat en Cloudflare Workers)
//     - suscribir(fn): cada vista se apunta y el núcleo la avisa cada
//       vez que cambia el historial, para que se redibuje
//
//   VISTAS (una por terminal: [data-chat-vista="hero"] y "burbuja")
//     - leen el historial y lo pintan, siempre con textContent
//     - mandan al núcleo lo que se escribe en su <input>
//
// Como las dos vistas leen el mismo historial, lo que se escribe en
// una aparece también en la otra.
//
// Todo va dentro de una IIFE. Lo único global es window.PortfolioChat,
// por si en el futuro otra parte de la web necesita usar el núcleo.
// =========================================================

(function () {

  const CHAT_ENDPOINT = 'https://chatbot-backend.albertlopezespinosa.workers.dev/chat';

  // Efecto de escritura de las respuestas: N caracteres cada X ms
  const CARACTERES_POR_PASO = 3;
  const MS_POR_PASO = 20;

  const TEXTO_AYUDA = [
    'Prueba a preguntar, por ejemplo:',
    '  ¿Qué experiencia tiene Albert?',
    '  ¿Qué series de vídeos tiene?',
    '  ¿Cómo puedo contactarle?',
    'Comandos:',
    '  help   muestra estas sugerencias',
    '  clear  limpia la conversación'
  ].join('\n');

  const ERROR_LIMITE = 'error: demasiadas peticiones, inténtalo en un minuto';
  const ERROR_GENERICO = 'error: no se ha podido conectar, inténtalo más tarde';

  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  // =======================================================
  // NÚCLEO
  // =======================================================

  // Cada entrada del historial:
  //   { id, tipo, texto, visibles }
  //   tipo: 'pregunta' | 'respuesta' | 'info' | 'error' | 'procesando'
  //   visibles: cuántos caracteres de "texto" se muestran (efecto de
  //             escritura); en todo lo que no es respuesta es texto.length
  const historial = [];
  const suscriptores = [];
  let siguienteId = 1;
  let ocupado = false;   // esperando o escribiendo una respuesta
  let generacion = 0;    // cambia con "clear": invalida respuestas en vuelo

  function notificar() {
    suscriptores.forEach(function (fn) { fn(historial, ocupado); });
  }

  function suscribir(fn) {
    suscriptores.push(fn);
    fn(historial, ocupado);
  }

  function agregar(tipo, texto, visibles) {
    const entrada = {
      id: siguienteId++,
      tipo: tipo,
      texto: texto,
      visibles: visibles === undefined ? texto.length : visibles
    };
    historial.push(entrada);
    return entrada;
  }

  function quitar(entrada) {
    const i = historial.indexOf(entrada);
    if (i !== -1) historial.splice(i, 1);
  }

  function limpiar() {
    historial.length = 0;
    generacion++;
    ocupado = false;
  }

  // Muestra la respuesta poco a poco. Con "reducir movimiento" activado,
  // aparece entera de golpe.
  function escribir(entrada, alTerminar) {
    if (reducirMovimiento.matches) {
      entrada.visibles = entrada.texto.length;
      alTerminar();
      return;
    }

    const miGeneracion = generacion;
    const temporizador = setInterval(function () {
      if (miGeneracion !== generacion) { // se hizo "clear" mientras escribía
        clearInterval(temporizador);
        return;
      }
      entrada.visibles = Math.min(entrada.texto.length, entrada.visibles + CARACTERES_POR_PASO);
      if (entrada.visibles >= entrada.texto.length) {
        clearInterval(temporizador);
        alTerminar();
      } else {
        notificar();
      }
    }, MS_POR_PASO);
  }

  async function preguntarAlBackend(texto) {
    const miGeneracion = generacion;
    ocupado = true;
    const procesando = agregar('procesando', 'procesando…');
    notificar();

    let respuesta = null;
    let error = null;

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texto })
      });

      if (res.status === 429) {
        error = ERROR_LIMITE;
      } else if (!res.ok) {
        error = ERROR_GENERICO;
      } else {
        const datos = await res.json();
        if (typeof datos.reply === 'string' && datos.reply.trim()) {
          respuesta = datos.reply;
        } else {
          error = ERROR_GENERICO;
        }
      }
    } catch (e) {
      error = ERROR_GENERICO;
    }

    // Si mientras tanto se hizo "clear", la respuesta ya no pinta nada
    if (miGeneracion !== generacion) return;

    quitar(procesando);

    if (error) {
      agregar('error', error);
      ocupado = false;
      notificar();
      return;
    }

    const entrada = agregar('respuesta', respuesta, 0);
    notificar();
    escribir(entrada, function () {
      ocupado = false;
      notificar();
    });
  }

  // Punto de entrada único para lo que se escribe en cualquiera de los
  // dos terminales. Devuelve false si no se ha aceptado (vacío u ocupado).
  function enviar(textoOriginal) {
    const texto = textoOriginal.trim();
    if (!texto || ocupado) return false;

    // Comandos locales: sin distinguir mayúsculas y sin espacios alrededor
    const comando = texto.toLowerCase();

    if (comando === 'clear') {
      limpiar();
      notificar();
      return true;
    }

    agregar('pregunta', texto);

    if (comando === 'help') {
      agregar('info', TEXTO_AYUDA);
      notificar();
      return true;
    }

    preguntarAlBackend(texto);
    return true;
  }

  window.PortfolioChat = {
    enviar: enviar,
    suscribir: suscribir,
    estaOcupado: function () { return ocupado; }
  };

  // =======================================================
  // VISTAS
  // =======================================================

  // Conecta un terminal ([data-chat-vista]) con el núcleo. Cada vista
  // recuerda qué nodo corresponde a cada entrada, así al escribir una
  // respuesta solo se actualiza el texto de esa línea.
  function crearVista(raiz) {
    const log = raiz.querySelector('[data-chat-log]');
    const scroll = raiz.querySelector('[data-chat-scroll]');
    const form = raiz.querySelector('[data-chat-form]');
    const input = raiz.querySelector('[data-chat-input]');
    const pista = raiz.querySelector('[data-chat-pista]');
    if (!log || !scroll || !form || !input) return null;

    const nodos = new Map(); // id de entrada -> { el, texto }

    function crearNodo(entrada) {
      const el = document.createElement('p');
      el.className = 'chat-log__linea chat-log__linea--' + entrada.tipo;

      // Las preguntas llevan el "$ " delante, como en una terminal.
      // El "$" es decorativo; el texto de la pregunta va en su propio span.
      let texto = el;
      if (entrada.tipo === 'pregunta') {
        const prompt = document.createElement('span');
        prompt.className = 'terminal__prompt';
        prompt.setAttribute('aria-hidden', 'true');
        prompt.textContent = '$ ';
        texto = document.createElement('span');
        el.appendChild(prompt);
        el.appendChild(texto);
      }

      return { el: el, texto: texto, mostrado: -1 };
    }

    function dibujar(entradas, ocupadoAhora) {
      const vivos = new Set();

      entradas.forEach(function (entrada) {
        vivos.add(entrada.id);
        let nodo = nodos.get(entrada.id);
        if (!nodo) {
          nodo = crearNodo(entrada);
          nodos.set(entrada.id, nodo);
          log.appendChild(nodo.el);
        }
        if (nodo.mostrado !== entrada.visibles) {
          // SIEMPRE textContent: el texto (del usuario o del backend)
          // nunca se interpreta como HTML
          nodo.texto.textContent = entrada.texto.slice(0, entrada.visibles);
          nodo.mostrado = entrada.visibles;
        }
      });

      // Quita las líneas que ya no están (clear, "procesando…")
      nodos.forEach(function (nodo, id) {
        if (!vivos.has(id)) {
          nodo.el.remove();
          nodos.delete(id);
        }
      });

      // Mientras se escribe la respuesta, los lectores de pantalla esperan
      // a que termine para anunciarla entera, en vez de trozo a trozo
      log.setAttribute('aria-busy', ocupadoAhora ? 'true' : 'false');

      // Pista "# escribe clear...": una sola línea fija bajo la última
      // respuesta. Se ve si ya hay alguna respuesta del chatbot y no hay
      // ninguna pregunta en curso (ni "procesando…" ni escribiéndose).
      if (pista) {
        const hayRespuesta = entradas.some(function (e) { return e.tipo === 'respuesta'; });
        pista.hidden = !(hayRespuesta && !ocupadoAhora);
      }

      // Siempre abajo del todo, mostrando lo último
      scroll.scrollTop = scroll.scrollHeight;
    }

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (enviar(input.value)) {
        input.value = '';
      }
    });

    // Clic en cualquier parte del cuerpo del terminal: enfoca el input
    // (salvo que el usuario esté seleccionando texto o pulse un enlace)
    scroll.addEventListener('click', function (evento) {
      if (evento.target.closest('a, button, input')) return;
      const seleccion = window.getSelection();
      if (seleccion && seleccion.toString()) return;
      input.focus({ preventScroll: true });
    });

    suscribir(dibujar);

    return { raiz: raiz, log: log, pista: pista, form: form, scroll: scroll, input: input };
  }

  // Terminal del hero: su altura máxima es la de su contenido fijo
  // (comando, estado y prompt), la misma que tenía antes del chat, para
  // que ese contenido nunca quede cortado; la conversación y la pista son
  // lo único que hace scroll. Se recalcula al cambiar el ancho, porque las
  // líneas largas se parten en más o menos filas. Sin JS se usa el valor
  // de respaldo del CSS (221px).
  function ajustarAlturaHero(vista) {
    const cuerpo = vista.scroll;
    const estilo = getComputedStyle(cuerpo);
    let alto = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);

    Array.prototype.forEach.call(cuerpo.children, function (hijo) {
      if (hijo === vista.log || hijo === vista.pista) return;
      alto += hijo.getBoundingClientRect().height;
      // El margen del prompt solo existe cuando hay conversación: no cuenta
      if (hijo !== vista.form) {
        const m = getComputedStyle(hijo);
        alto += parseFloat(m.marginTop) + parseFloat(m.marginBottom);
      }
    });

    cuerpo.style.setProperty('--chat-alto-fijo', Math.ceil(alto) + 'px');
    cuerpo.scrollTop = cuerpo.scrollHeight;
  }

  const vistaHero = crearVista(document.querySelector('[data-chat-vista="hero"]') || document.createElement('div'));
  const vistaBurbuja = crearVista(document.querySelector('[data-chat-vista="burbuja"]') || document.createElement('div'));

  if (vistaHero) {
    ajustarAlturaHero(vistaHero);
    window.addEventListener('resize', function () { ajustarAlturaHero(vistaHero); });
    // Las fuentes web cambian el ancho del texto al terminar de cargar
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ajustarAlturaHero(vistaHero); });
    }
  }

  // =======================================================
  // MINI TERMINAL FLOTANTE: abrir / cerrar
  // =======================================================

  const contenedor = document.querySelector('.chat-widget');
  const botonToggle = document.getElementById('chat-widget-toggle');
  const panel = document.getElementById('chat-widget-panel');
  if (!contenedor || !botonToggle || !panel || !vistaBurbuja) return;

  const botonCerrar = panel.querySelector('.chat-widget__cerrar');

  function abrir() {
    contenedor.classList.add('chat-widget--abierto');
    panel.hidden = false;
    botonToggle.setAttribute('aria-expanded', 'true');
    botonToggle.setAttribute('aria-label', 'Cerrar el asistente');
    // Con el panel abierto, solo él anuncia las respuestas (si no, los
    // lectores de pantalla las leerían dos veces)
    if (vistaHero) vistaHero.log.setAttribute('aria-live', 'off');
    vistaBurbuja.input.focus();
  }

  function cerrar(devolverFoco) {
    contenedor.classList.remove('chat-widget--abierto');
    panel.hidden = true;
    botonToggle.setAttribute('aria-expanded', 'false');
    botonToggle.setAttribute('aria-label', 'Abrir el asistente');
    if (vistaHero) vistaHero.log.setAttribute('aria-live', 'polite');
    if (devolverFoco) botonToggle.focus();
  }

  botonToggle.addEventListener('click', function () {
    if (panel.hidden) {
      abrir();
    } else {
      cerrar(false);
    }
  });

  if (botonCerrar) {
    botonCerrar.addEventListener('click', function () { cerrar(true); });
  }

  // Escape cierra el panel
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !panel.hidden) {
      cerrar(true);
    }
  });

})();
