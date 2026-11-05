// =========================================================
// DATOS DE LAS SERIES DE VÍDEOS
//
// Única fuente de verdad para las series. A partir de estos datos,
// js/series.js genera:
//   - las tarjetas de la sección "Series" de index.html
//   - la lista de vídeos de cada página de series/
//   - el número de vídeos de cada serie y el total (con .length)
//
// Es un .js (no un .json con fetch) para que funcione también al abrir
// el HTML directamente desde disco (file://).
//
// Las rutas (caratula, pagina) son relativas a la raíz del sitio.
//
// AÑADIR UN VÍDEO: añade un objeto { titulo, url } al FINAL del array
// "videos" de su serie. El número se calcula solo por su posición.
// =========================================================

const SERIES = [
  {
    id: 'ubuntu-server-26-04',
    titulo: 'Ubuntu Server 26.04 LTS',
    descripcion: 'Instalación, configuración y administración de Ubuntu Server 26.04 LTS paso a paso.',
    estado: 'en-curso', // "en-curso" o "completa"
    playlist: 'https://www.youtube.com/playlist?list=PLBJCFe5HFnjQ',
    caratula: 'assets/img/caratula-ubuntu-server.png',
    pagina: 'series/ubuntu-server-26-04.html',
    proximo: 'Administrar el dominio Samba desde Windows con RSAT',
    videos: [
      {
        titulo: 'Cómo instalar y preparar Ubuntu Server 26.04 LTS desde cero',
        url: 'https://youtu.be/dhWQHKDa-_w'
      },
      {
        titulo: 'Cómo acceder por SSH a un servidor Ubuntu desde tu propio equipo',
        url: 'https://youtu.be/NRQ6Smun7q0'
      },
      {
        titulo: 'Cómo convertir un servidor Ubuntu en controlador de dominio con Samba',
        url: 'https://youtu.be/JEXMWts-kPE'
      },
      {
        titulo: 'Cómo montar un servidor DHCP con Kea en Ubuntu Server',
        url: 'https://youtu.be/_JGDpNrFeWU'
      }
    ]
  },
  {
    id: 'windows-server-2022',
    titulo: 'Windows Server 2022',
    descripcion: 'Configuración y administración paso a paso: Active Directory, DHCP, DNS, recursos compartidos, copias de seguridad, GPOs y mucho más.',
    estado: 'completa',
    playlist: 'https://www.youtube.com/playlist?list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN',
    caratula: 'assets/img/caratula-windows-server.png',
    pagina: 'series/windows-server-2022.html',
    proximo: null,
    videos: [
      {
        titulo: 'Cómo configurar Active Directory en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=yqFu7tcqLF4&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN'
      },
      {
        titulo: 'Cómo configurar DHCP en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=oQbRMGpqTxA&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=2'
      },
      {
        titulo: 'Cómo configurar DNS en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=yEeeTGqQ_ng&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=3'
      },
      {
        titulo: 'Cómo compartir carpetas en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=UE1IEw0H2co&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=4'
      },
      {
        titulo: 'Cómo realizar, restaurar y validar una copia de seguridad en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=JmQRWjy9Hok&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=5'
      },
      {
        titulo: 'Cómo aplicar políticas de grupo (GPO) en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=ZLct-AAB_DU&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=6'
      },
      {
        titulo: 'Cómo configurar la redirección de carpetas en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=JGjwuvPJN_c&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=7'
      },
      {
        titulo: 'Cómo configurar perfiles móviles en Windows Server 2022',
        url: 'https://www.youtube.com/watch?v=a1Cks29_qwc&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=8'
      },
      {
        titulo: 'Cómo promover un servidor Windows Server 2022 a controlador de dominio adicional',
        url: 'https://www.youtube.com/watch?v=MQRrPL2UWbU&list=PLboG42JGoftoaz6fxUZZdFjoFDTb03YpN&index=9'
      }
    ]
  }
];
