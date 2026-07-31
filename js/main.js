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
