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
