// Lo propio de N1 FEM Mercato en la pagina.
//
// Todo lo que pinta la web —el semaforo, las dos tablas, el masonry, los
// filtros, la cabecera de temporada— vive en `web/base.js`, que es una copia
// generada de mercato-motor/web/base.js y no se edita aqui. Este fichero solo
// dice QUE liga es, con el mismo criterio del CONTRATO: lo que cambiaria si la
// liga fuese otra entra como dato, nunca como bandera.
//
// Modulo, asi que va diferido: cuando corre, el DOM ya esta.
//
// La liga son DOS grupos de 14, igual que la LF2, y desde que el JSON emite
// `temporadas[].grupos` la pagina pinta una rejilla por grupo con su titulo
// fuera de las tarjetas. De cuantos grupos hay no se entera este fichero: lo
// dice el JSON.

import { arrancar, esc } from './base.js';

await arrancar({
  etiqueta: 'N1',
  competicion: (d) => d.competicion,

  // Cuantos clubes se han mirado de verdad. Aqui todavia importa: no todos los
  // de la temporada cerrada tienen redes investigadas, y sin este numero un
  // vacio se leeria como "no han fichado".
  cuartoTotal: (t) => ['Clubes escaneados', `${t.total.conArchivo}/${t.total.clubes}`],

  // La N1 es andaluza y la provincia agrupa de verdad: media tabla es de
  // Sevilla y Malaga. La LF2 es estatal y no declara este filtro; que no venga
  // es lo que lo desactiva, no una bandera.
  filtros: [{ id: 'fProvincia', param: 'provincia', vacio: 'Todas', valor: (e) => e.provincia }],

  equipo: {
    // El nombre del EQUIPO, que es como se le conoce; el del club sale en
    // pequeño encima. Que en N1 el equipo no llevaba patrocinador —lo que decia
    // aqui— dejo de ser verdad: 16 de los 28 se inscriben con otro nombre, y la
    // diferencia es casi siempre justo eso, el patrocinador.
    // `etiquetaCorta` cuando la hay: la FAB inscribe a alguno con el
    // patrocinador pegado —"CLINICAS DENTALES DR. MANUEL CARA CB LA MOJONERA",
    // 48 caracteres— y eso no es como se le llama. Se acorta SOLO para pintar:
    // la etiqueta oficial se queda entera porque es con lo que se reconoce al
    // club dentro de un anuncio. Mismo orden de preferencia que en LF2.
    nombre: (e) => e.etiquetaCorta ?? e.etiquetaFAB ?? e.club,
    club: (e) => e.club,
    // No se declaran `localidad`, `pabellon` ni `ficha`: la FAB no publica ficha
    // de equipo ni da la sede en el registro. No son casos especiales, son
    // claves que no vienen.

    // Manda el escudo oficial de 26/27 bajado de la FAB; para la 25/26, el del
    // snapshot de aquel año, que es el que llevaban entonces.
    // `escudoComun` PRIMERO: lo pone el catalogo compartido de las tres ligas y
    // es la ultima palabra, para que un club que juega en dos categorias se vea
    // igual en las dos webs. Sin el delante, la unificacion se escribia en
    // `escudo` y aqui no la pintaba nadie, porque manda `escudoOficial`.
    // Detras, lo de siempre: el oficial de 26/27 bajado de la FAB y, para la
    // 25/26, el del snapshot de aquel año, que es el que llevaban entonces.
    escudo: (e) => e.escudoComun ?? e.escudoOficial ?? e.escudo,
    // El color sale del ESCUDO, no de la camiseta: la FAB no publica
    // equipaciones. Por eso aqui no hace falta la marca de tinte claro.
    tinte: (e) => e.color,
    // La FAB da las cuatro cuentas en un solo objeto, ya con la forma que espera
    // el motor.
    redes: (e) => e.redes,
  },

  /**
   * Lo que sabemos de un club que NO juega N1 y sale como procedencia o destino.
   *
   * Salen del CATALOGO COMPARTIDO de las tres ligas, que es donde cada una deja
   * los suyos: el club que aqui es una procedencia sin escudo, en LF2 o en LFCh
   * es un equipo con el suyo ya bajado. El trozo que hace falta viaja dentro de
   * mercato.json, asi que añadir un club es correr un importador del motor y no
   * tocar este fichero.
   *
   * La clave es el nombre normalizado, y hace falta el paso por `alias` porque
   * la FEB inscribe con el patrocinador delante y los clubes no lo usan:
   * "FUSTECMA NBF CASTELLO" en la ficha, "NBF Castello" en el anuncio.
   *
   * Nada mas listo que eso: emparejar por parecido acabaria poniendole a un club
   * el escudo de otro, y eso es peor que dejar el hueco.
   */
  clubDeFuera: (club, d) => {
    const cat = d?.escudosDeFuera;
    if (!cat) return null;
    // Sin espacios ni puntuacion, que es `claveDeClub` del motor. Aqui se
    // conservaban los espacios y era una clave PROPIA: mientras el catalogo lo
    // escribia N1 sola daba igual, pero el compartido indexa a su manera y
    // «C.B. SANTFELIUENC» daba `C B SANTFELIUENC` contra su `CBSANTFELIUENC`.
    // Ni un acierto, y sin error: el hueco gris se ve igual que el de un club
    // que de verdad no tenemos.
    const clave = String(club ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]+/g, '');
    const ficha = cat.escudos?.[cat.alias?.[clave] ?? clave];
    return ficha ? { escudo: ficha.fichero, liga: ficha.liga ?? null } : null;
  },

  // Aqui las fotos SI estan descargadas: viajan como nombre de fichero.
  foto: (j) => (j.foto ? `./datos/fotos/${j.foto}` : null),
  // Y de quien protagoniza un movimiento tambien las hay, porque si la
  // reconocemos en el censo de otro club de N1 tenemos su retrato oficial. Es
  // mejor que la foto del anuncio: dice quien es, no como la vistio el club que
  // la ficha.
  fotoDelMovimiento: (m) => (m.foto ? `./datos/fotos/${m.foto}` : null),

  // El dorsal como COLUMNA propia, y los partidos y los puntos detras del
  // nombre. La FAB los rellena casi siempre, asi que dan columnas utiles; la FEB
  // no trae dorsal en LF2 y alli va todo en una linea bajo el nombre. Es
  // `filaDePlantilla` del CONTRATO: lo que entrega cada federacion, no una
  // decision nuestra.
  plantilla: {
    // El dorsal ya NO es columna: vive en la esquina de la foto. Una columna
    // menos es una columna menos de scroll horizontal en un movil, y un numero
    // de dos cifras cabe de sobra encima del retrato sin taparlo.
    insignia: (j) => j.dorsal ?? '',
    antes: [],
    // PJ y PTS en UNA columna. Son dos numeros cortos que se leen juntos -"20
    // partidos a 1,8 puntos"- y separados costaban dos cabeceras, dos rellenos
    // y dos bordes para pintar cuatro caracteres.
    // Si no jugo ningun partido no hay media que enseñar, asi que se queda el
    // cero solo: "0 · 0.0" sugiere un dato que no existe.
    despues: [
      {
        th: 'PJ/PTS',
        clase: 'num',
        celda: (j) => {
          const pj = j.partidos ?? 0;
          if (!pj) return esc(String(pj));
          return `${esc(String(pj))}<span class="sep">/</span>${j.puntos != null ? esc(j.puntos.toFixed(1)) : '—'}`;
        },
      },
    ],
  },

  // No se declara `notaCuentaCompartida`: en N1 ningun club mete dos equipos en
  // la misma categoria, asi que la nota no llega a pintarse nunca.
});
