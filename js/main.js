// =========================================================
// SCROLL SUAVE DEL MENÚ DE NAVEGACIÓN
//
// El CSS ya tiene "scroll-behavior: smooth" en el <html>, así que
// el navegador anima el desplazamiento por sí solo al pulsar un
// enlace tipo href="#seccion". Este script solo se encarga de
// evitar el "salto" instantáneo en navegadores muy antiguos que no
// soporten esa propiedad CSS, controlando el scroll manualmente.
// =========================================================

// Seleccionamos todos los enlaces del menú que apuntan a una sección (#algo)
const enlacesMenu = document.querySelectorAll('.navbar__links a[href^="#"]');

enlacesMenu.forEach(function (enlace) {
  enlace.addEventListener('click', function (evento) {
    const idSeccion = enlace.getAttribute('href'); // ej: "#sobre-mi"
    const seccion = document.querySelector(idSeccion);

    if (seccion) {
      evento.preventDefault(); // evitamos el salto brusco por defecto
      seccion.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// =========================================================
// MODO CLARO / OSCURO (theme toggle)
//
// Todo el color del sitio vive en variables CSS (custom properties).
// Este script no aplica ningún color directamente: solo pone o quita
// el atributo data-theme="dark" en el <body>, y es el CSS (styles.css)
// quien decide qué variables y qué icono (luna/sol) usar según ese
// atributo. Así el JS se mantiene simple.
// =========================================================

const CLAVE_TEMA = 'tema-preferido'; // clave usada en localStorage
const botonTema = document.getElementById('theme-toggle');

// Aplica un tema ('light' o 'dark') al body
function aplicarTema(tema) {
  if (tema === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if (botonTema) botonTema.setAttribute('aria-label', 'Cambiar a modo claro');
  } else {
    document.body.removeAttribute('data-theme');
    if (botonTema) botonTema.setAttribute('aria-label', 'Cambiar a modo oscuro');
  }
}

// 1. ¿El usuario ya eligió un tema antes? Si no, usamos la preferencia
//    del sistema operativo (prefers-color-scheme)
const temaGuardado = localStorage.getItem(CLAVE_TEMA);
const prefiereOscuroElSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
const temaInicial = temaGuardado || (prefiereOscuroElSistema ? 'dark' : 'light');

aplicarTema(temaInicial);

// 2. Al pulsar el botón, alternamos el tema y guardamos la elección
if (botonTema) {
  botonTema.addEventListener('click', function () {
    const esOscuroAhora = document.body.getAttribute('data-theme') === 'dark';
    const nuevoTema = esOscuroAhora ? 'light' : 'dark';

    aplicarTema(nuevoTema);
    localStorage.setItem(CLAVE_TEMA, nuevoTema);
  });
}

// =========================================================
// NAV QUE SE OCULTA AL HACER SCROLL (solo móvil)
//
// Solo compara la posición de scroll con la del evento anterior: si
// bajamos, escondemos el nav (clase "navbar--oculto"); si subimos,
// aunque sea un poco, lo mostramos enseguida. El CSS es quien decide
// cómo se ve "oculto" (transform) y quien limita este comportamiento
// a móvil (el media query de la clase), así que aquí no hace falta
// comprobar el ancho de la ventana.
// =========================================================

const navbar = document.querySelector('.navbar');
const MEDIA_MOVIL = window.matchMedia('(max-width: 600px)');

let ultimaPosicionScroll = window.scrollY;

function alHacerScroll() {
  const posicionActual = window.scrollY;

  // En la parte superior de la página siempre mostramos el nav, aunque
  // el último movimiento registrado fuera "hacia abajo"
  if (posicionActual <= 0) {
    navbar.classList.remove('navbar--oculto');
  } else if (posicionActual > ultimaPosicionScroll) {
    navbar.classList.add('navbar--oculto'); // scroll hacia abajo
  } else {
    navbar.classList.remove('navbar--oculto'); // scroll hacia arriba
  }

  ultimaPosicionScroll = posicionActual;
}

if (navbar) {
  window.addEventListener('scroll', alHacerScroll, { passive: true });

  // Al pasar a escritorio no queremos que se quede oculto si el usuario
  // había hecho scroll hacia abajo en móvil antes de ensanchar la ventana
  MEDIA_MOVIL.addEventListener('change', function (evento) {
    if (!evento.matches) {
      navbar.classList.remove('navbar--oculto');
    }
  });
}
