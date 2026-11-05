// =========================================================
// RENDERIZADO DE LAS SERIES
//
// Genera el HTML de las series a partir de la constante global SERIES
// (definida en js/series-data.js, que debe cargarse ANTES que este archivo).
//
// En index.html:
//   - [data-serie-destacada]: bloque "Último vídeo" (último vídeo de la
//     primera serie en curso).
//   - [data-series-grid]: una tarjeta por serie (en curso primero), con
//     badge, contador, hasta 4 episodios, "+N" y el próximo vídeo.
//   - [data-series-count] / [data-series-total]: nº de series y de vídeos
//     (los usa el bloque de terminal del hero).
//
// En series/*.html:
//   - [data-serie-videos="<id>"]: lista completa de episodios de la serie.
//   - [data-serie-contador="<id>"]: "4 vídeos · en producción".
//   - [data-serie-num-videos="<id>"]: solo el número de vídeos.
//
// Va dentro de una IIFE para no crear variables globales: la única
// global compartida es SERIES.
// =========================================================

(function () {

  if (typeof SERIES === 'undefined') {
    console.error('series.js: falta cargar js/series-data.js antes que este script.');
    return;
  }

  // Máximo de episodios que se listan en cada tarjeta de la portada
  const MAX_EPISODIOS_TARJETA = 4;

  // ---------- Cálculos ----------

  function numVideos(serie) {
    return serie.videos.length;
  }

  function totalVideos() {
    return SERIES.reduce(function (total, serie) {
      return total + numVideos(serie);
    }, 0);
  }

  function enCurso(serie) {
    return serie.estado === 'en-curso';
  }

  function buscarSerie(id) {
    return SERIES.find(function (serie) { return serie.id === id; });
  }

  // Copia de SERIES con las series en curso primero (sort es estable:
  // dentro de cada grupo se respeta el orden del archivo de datos)
  function seriesOrdenadas() {
    return SERIES.slice().sort(function (a, b) {
      return Number(enCurso(b)) - Number(enCurso(a));
    });
  }

  // 1 -> "01", 12 -> "12"
  function dosDigitos(n) {
    return String(n).padStart(2, '0');
  }

  function textoVideos(n) {
    return n + (n === 1 ? ' vídeo' : ' vídeos');
  }

  // ---------- Helpers de DOM ----------

  function crear(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function enlaceExterno(el, url) {
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    return el;
  }

  // Las rutas de SERIES (caratula, pagina) son relativas a la raíz del
  // sitio. Las páginas de series/ están un nivel por debajo y declaran
  // <body data-raiz="../"> para que las rutas sigan funcionando.
  const RAIZ = document.body.getAttribute('data-raiz') || '';

  function ruta(relativa) {
    return RAIZ + relativa;
  }

  // ---------- Piezas reutilizables ----------

  // "4 vídeos · en producción" (en curso) o "9 vídeos" (completa)
  function crearContador(serie) {
    const p = crear('p', 'serie-contador', textoVideos(numVideos(serie)));
    if (enCurso(serie)) {
      p.appendChild(document.createTextNode(' · '));
      p.appendChild(crear('span', 'serie-contador__estado', 'en producción'));
    }
    return p;
  }

  function crearBadge(serie) {
    if (enCurso(serie)) {
      const badge = crear('span', 'badge badge--en-curso');
      const punto = crear('span', 'badge__punto');
      punto.setAttribute('aria-hidden', 'true');
      badge.appendChild(punto);
      badge.appendChild(document.createTextNode('En curso'));
      return badge;
    }
    return crear('span', 'badge badge--completa', '✓ Completa');
  }

  // En las tarjetas de la portada ("corto") se usa tituloCorto si existe;
  // en las páginas de series/ siempre el título completo
  function tituloVideo(video, corto) {
    return (corto && video.tituloCorto) || video.titulo;
  }

  // Fila de episodio: número (01, 02...) + título enlazado a YouTube
  function crearEpisodio(video, indice, corto) {
    const li = crear('li', 'episodio');
    li.appendChild(crear('span', 'episodio__numero', dosDigitos(indice + 1)));
    const enlace = enlaceExterno(crear('a', 'episodio__titulo', tituloVideo(video, corto)), video.url);
    // El título corto puede recortarse con "…": el completo queda como tooltip
    if (corto) enlace.title = video.titulo;
    li.appendChild(enlace);
    return li;
  }

  // Última fila cuando hay más de N episodios: "+5" en la columna del
  // número y los títulos restantes separados por comas, sin enlace
  function crearFilaRestantes(restantes, corto) {
    const li = crear('li', 'episodio episodio--resto');
    li.appendChild(crear('span', 'episodio__numero', '+' + restantes.length));
    const texto = restantes.map(function (video) {
      return tituloVideo(video, corto);
    }).join(', ');
    const titulos = crear('span', 'episodio__titulo', texto);
    // Si la lista no cabe en una línea se recorta con "…": completa en el tooltip
    titulos.title = texto;
    li.appendChild(titulos);
    return li;
  }

  // Próximo vídeo planificado: en gris, sin enlace, con "· próximamente"
  function crearProximo(serie, corto) {
    const li = crear('li', 'episodio episodio--proximo');
    li.appendChild(crear('span', 'episodio__numero', dosDigitos(numVideos(serie) + 1)));
    const texto = (corto && serie.proximoCorto) || serie.proximo;
    li.appendChild(crear('span', 'episodio__titulo', texto + ' · próximamente'));
    return li;
  }

  // Lista de episodios. Con "maximo" (tarjetas de la portada) usa los
  // títulos cortos, corta la lista y resume el resto en una fila "+N".
  function crearListaEpisodios(serie, maximo) {
    const corto = Boolean(maximo);
    const lista = crear('ol', corto ? 'episodios episodios--compacta' : 'episodios');
    const visibles = corto ? serie.videos.slice(0, maximo) : serie.videos;

    visibles.forEach(function (video, indice) {
      lista.appendChild(crearEpisodio(video, indice, corto));
    });

    const restantes = serie.videos.slice(visibles.length);
    if (restantes.length > 0) {
      lista.appendChild(crearFilaRestantes(restantes, corto));
    }

    if (serie.proximo) {
      lista.appendChild(crearProximo(serie, corto));
    }

    return lista;
  }

  // ---------- index.html: bloque "Último vídeo" ----------

  function renderizarDestacado() {
    const contenedor = document.querySelector('[data-serie-destacada]');
    if (!contenedor) return;

    const serie = SERIES.find(function (s) { return enCurso(s) && numVideos(s) > 0; });
    if (!serie) {
      contenedor.hidden = true; // ninguna serie en curso: no se muestra
      return;
    }

    const video = serie.videos[numVideos(serie) - 1];

    const bloque = enlaceExterno(crear('a', 'destacado'), video.url);

    const miniatura = crear('div', 'destacado__miniatura');
    const img = crear('img');
    img.src = ruta(serie.caratula);
    img.alt = '';
    miniatura.appendChild(img);
    const play = crear('span', 'destacado__play');
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
    miniatura.appendChild(play);
    bloque.appendChild(miniatura);

    const contenido = crear('div', 'destacado__contenido');
    const etiqueta = crear('p', 'destacado__etiqueta');
    etiqueta.appendChild(crear('span', 'destacado__etiqueta-punto', '●'));
    etiqueta.appendChild(document.createTextNode(' último vídeo · ' + serie.titulo));
    contenido.appendChild(etiqueta);
    contenido.appendChild(crear('h3', 'destacado__titulo', video.titulo));
    // Descripción opcional: si el vídeo no la tiene, no se pinta la línea
    if (video.descripcion) {
      contenido.appendChild(crear('p', 'destacado__descripcion', video.descripcion));
    }
    contenido.appendChild(crear('span', 'destacado__enlace', 'Ver en YouTube →'));
    bloque.appendChild(contenido);

    contenedor.textContent = '';
    contenedor.appendChild(bloque);
  }

  // ---------- index.html: tarjetas de serie ----------

  function crearTarjeta(serie) {
    const tarjeta = crear('article', 'serie-card');

    // Carátula: enlaza a la página de la serie. Es un duplicado del enlace
    // del título, así que se saca del orden de tabulación y de los lectores.
    const miniatura = crear('a', 'serie-card__miniatura');
    miniatura.href = ruta(serie.pagina);
    miniatura.tabIndex = -1;
    miniatura.setAttribute('aria-hidden', 'true');
    const img = crear('img');
    img.src = ruta(serie.caratula);
    img.alt = '';
    img.setAttribute('loading', 'lazy');
    miniatura.appendChild(img);
    miniatura.appendChild(crearBadge(serie));
    tarjeta.appendChild(miniatura);

    const contenido = crear('div', 'serie-card__contenido');
    const titulo = crear('h3', 'serie-card__titulo');
    const enlaceTitulo = crear('a', '', serie.titulo);
    enlaceTitulo.href = ruta(serie.pagina);
    titulo.appendChild(enlaceTitulo);
    contenido.appendChild(titulo);
    contenido.appendChild(crearContador(serie));
    contenido.appendChild(crearListaEpisodios(serie, MAX_EPISODIOS_TARJETA));

    const enlace = crear('a', 'serie-card__enlace', 'Ver la serie completa →');
    enlace.href = ruta(serie.pagina);
    contenido.appendChild(enlace);

    tarjeta.appendChild(contenido);
    return tarjeta;
  }

  function renderizarTarjetas() {
    const grid = document.querySelector('[data-series-grid]');
    if (!grid) return;

    grid.textContent = '';
    seriesOrdenadas().forEach(function (serie) {
      grid.appendChild(crearTarjeta(serie));
    });
  }

  // ---------- series/*.html: lista completa y contador ----------

  function renderizarPaginasSerie() {
    document.querySelectorAll('[data-serie-videos]').forEach(function (el) {
      const serie = buscarSerie(el.getAttribute('data-serie-videos'));
      if (!serie) return;
      el.textContent = '';
      el.appendChild(crearListaEpisodios(serie));
    });

    document.querySelectorAll('[data-serie-contador]').forEach(function (el) {
      const serie = buscarSerie(el.getAttribute('data-serie-contador'));
      if (serie) el.replaceWith(crearContador(serie));
    });
  }

  // ---------- Contadores sueltos ----------

  function renderizarContadores() {
    document.querySelectorAll('[data-series-count]').forEach(function (el) {
      el.textContent = SERIES.length;
    });

    document.querySelectorAll('[data-series-total]').forEach(function (el) {
      el.textContent = totalVideos();
    });

    document.querySelectorAll('[data-serie-num-videos]').forEach(function (el) {
      const serie = buscarSerie(el.getAttribute('data-serie-num-videos'));
      if (serie) el.textContent = numVideos(serie);
    });
  }

  renderizarDestacado();
  renderizarTarjetas();
  renderizarPaginasSerie();
  renderizarContadores();

})();
