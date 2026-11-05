// =========================================================
// RENDERIZADO DE LAS SERIES
//
// Genera el HTML de las series a partir de la constante global SERIES
// (definida en js/series-data.js, que debe cargarse ANTES que este archivo).
//
//   - index.html: rellena el contenedor [data-series-grid] con una
//     tarjeta por serie (badge de estado, nº de vídeos y enlace).
//   - series/*.html: rellena la lista [data-serie-videos="<id>"] con
//     los vídeos de la serie cuyo id coincide.
//   - Cualquier elemento [data-series-total] recibe el total de vídeos
//     de todas las series, y [data-serie-num-videos="<id>"] el de una serie.
//
// Va dentro de una IIFE para no crear variables globales: la única
// global compartida es SERIES.
// =========================================================

(function () {

  if (typeof SERIES === 'undefined') {
    console.error('series.js: falta cargar js/series-data.js antes que este script.');
    return;
  }

  // ---------- Cálculos ----------

  function numVideos(serie) {
    return serie.videos.length;
  }

  function totalVideos() {
    return SERIES.reduce(function (total, serie) {
      return total + numVideos(serie);
    }, 0);
  }

  function buscarSerie(id) {
    return SERIES.find(function (serie) { return serie.id === id; });
  }

  // Pequeño helper para crear elementos con clase y texto
  function crear(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  // ---------- Tarjetas de index.html ----------

  function crearTarjeta(serie) {
    const tarjeta = crear('a', 'serie-card');
    tarjeta.href = serie.pagina;

    // Badge "En curso" (solo para series en curso)
    if (serie.estado === 'en-curso') {
      const badge = crear('span', 'badge-en-curso');
      const punto = crear('span', 'badge-en-curso__punto');
      punto.setAttribute('aria-hidden', 'true');
      badge.appendChild(punto);
      badge.appendChild(document.createTextNode('En curso'));
      tarjeta.appendChild(badge);
    }

    const miniatura = crear('div', 'serie-card__miniatura');
    const img = crear('img', 'serie-card__miniatura-img');
    img.src = serie.caratula;
    img.alt = 'Carátula de la serie ' + serie.titulo;
    img.setAttribute('loading', 'lazy');
    miniatura.appendChild(img);
    tarjeta.appendChild(miniatura);

    const contenido = crear('div', 'serie-card__contenido');
    contenido.appendChild(crear('h3', 'serie-card__titulo', serie.titulo));
    contenido.appendChild(crear('p', 'serie-card__descripcion', serie.descripcion));

    const n = numVideos(serie);
    const textoEnlace = 'Ver ' + n + (n === 1 ? ' vídeo' : ' vídeos') + ' →';
    contenido.appendChild(crear('span', 'serie-card__enlace', textoEnlace));
    tarjeta.appendChild(contenido);

    return tarjeta;
  }

  function renderizarTarjetas() {
    const grid = document.querySelector('[data-series-grid]');
    if (!grid) return;

    grid.textContent = '';
    SERIES.forEach(function (serie) {
      grid.appendChild(crearTarjeta(serie));
    });
  }

  // ---------- Lista de vídeos de series/*.html ----------

  function crearVideoItem(video, indice) {
    const item = crear('li', 'video-item');
    item.appendChild(crear('span', 'video-item__numero', (indice + 1) + '.'));

    const enlace = crear('a', 'video-item__titulo', video.titulo);
    enlace.href = video.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    item.appendChild(enlace);

    return item;
  }

  function renderizarListasVideos() {
    document.querySelectorAll('[data-serie-videos]').forEach(function (lista) {
      const serie = buscarSerie(lista.getAttribute('data-serie-videos'));
      if (!serie) return;

      lista.textContent = '';
      serie.videos.forEach(function (video, indice) {
        lista.appendChild(crearVideoItem(video, indice));
      });
    });
  }

  // ---------- Contadores sueltos ----------

  function renderizarContadores() {
    document.querySelectorAll('[data-series-total]').forEach(function (el) {
      el.textContent = totalVideos();
    });

    document.querySelectorAll('[data-serie-num-videos]').forEach(function (el) {
      const serie = buscarSerie(el.getAttribute('data-serie-num-videos'));
      if (serie) el.textContent = numVideos(serie);
    });
  }

  renderizarTarjetas();
  renderizarListasVideos();
  renderizarContadores();

})();
