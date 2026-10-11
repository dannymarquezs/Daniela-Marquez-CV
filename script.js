// ---------- 1. Botón que cambia el color de la página ----------
const btnColor = document.getElementById('btnColor');

btnColor.addEventListener('click', function () {
  document.body.classList.toggle('tema-lila');
});

// ---------- 2. Botón que muestra / oculta el dato curioso ----------
const btnDato = document.getElementById('btnDato');
const dato = document.getElementById('datoCurioso');

btnDato.addEventListener('click', function () {
  dato.classList.toggle('oculto');

  if (dato.classList.contains('oculto')) {
    btnDato.textContent = '✨ Dato curioso';
  } else {
    btnDato.textContent = 'Ocultar';
  }
});

// ---------- 3. Las secciones aparecen al hacer scroll ----------
const secciones = document.querySelectorAll('.aparecer');

const observador = new IntersectionObserver(function (entradas) {
  entradas.forEach(function (entrada) {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

secciones.forEach(function (seccion) {
  observador.observe(seccion);
});

// ---------- 4. Detalles decorativos (estrellas) ----------
// Cada estrella se coloca en un lugar al azar, pero SOLO si ahí no tapa
// ningún texto, botón o imagen, y si no queda pegada a otra estrella.
// La imagen "detalle.png" (la de dos estrellas) además se mantiene bien
// separada de las estrellas simples y grandes.
const detalles = [
  { src: 'img/detalle.png',        tipo: 'doble',    ancho: [70, 110], proporcion: 229 / 400 },
  { src: 'img/detalle-simple.png', tipo: 'estrella', ancho: [40, 70],  proporcion: 300 / 288 },
  { src: 'img/detalle-grande.png', tipo: 'estrella', ancho: [60, 90],  proporcion: 400 / 382 }
];

const MARGEN_TEXTO = 24;      // distancia mínima entre una estrella y un texto/imagen
const DISTANCIA_NORMAL = 60;  // distancia mínima entre dos estrellas
const DISTANCIA_DOBLE = 160;  // distancia mínima si una es "detalle.png"

// Lo que NO se debe tapar
const OBSTACULOS_HERO = '.hero-texto > *, .hero-foto';
const OBSTACULOS_SECCION = 'h2, h3, p, li, button, img:not(.deco), .bloque';

let puestos = []; // estrellas ya colocadas (con su posición en la página)

// Devuelve un número decimal entre min y max
function numeroAzar(min, max) {
  return Math.random() * (max - min) + min;
}

// ¿Dos rectángulos se tocan (con un margen extra)?
function chocan(a, b, margen) {
  return !(
    a.derecha + margen <= b.izquierda ||
    a.izquierda - margen >= b.derecha ||
    a.abajo + margen <= b.arriba ||
    a.arriba - margen >= b.abajo
  );
}

// Rectángulos de todo lo que hay en el contenedor, relativos a él
function medirObstaculos(contenedor, selector) {
  const base = contenedor.getBoundingClientRect();
  const lista = [];

  contenedor.querySelectorAll(selector).forEach(function (el) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return; // ocultos (ej. dato curioso)
    lista.push({
      izquierda: r.left - base.left,
      derecha: r.right - base.left,
      arriba: r.top - base.top,
      abajo: r.bottom - base.top
    });
  });

  return lista;
}

// Intenta colocar una estrella; devuelve true si encontró un buen lugar
function colocarDetalle(contenedor, obstaculos) {
  const base = contenedor.getBoundingClientRect();
  const tipo = detalles[Math.floor(Math.random() * detalles.length)];

  for (let intento = 0; intento < 80; intento++) {
    const ancho = numeroAzar(tipo.ancho[0], tipo.ancho[1]);
    const alto = ancho * tipo.proporcion;

    // Puede usar un poco del espacio a los lados de la sección,
    // pero sin salirse de la pantalla
    const minX = Math.max(-160, 8 - base.left);
    const maxX = Math.min(base.width + 160, window.innerWidth - 8 - base.left) - ancho;
    const maxY = base.height - alto;
    if (maxX <= minX || maxY <= 0) return false;

    const x = numeroAzar(minX, maxX);
    const y = numeroAzar(0, maxY);
    const local = { izquierda: x, derecha: x + ancho, arriba: y, abajo: y + alto };

    // 1. No debe tocar textos, botones ni imágenes
    if (obstaculos.some(function (o) { return chocan(local, o, MARGEN_TEXTO); })) continue;

    // 2. No debe quedar cerca de otras estrellas (posición en toda la página)
    const enPagina = {
      izquierda: contenedor.offsetLeft + x,
      derecha: contenedor.offsetLeft + x + ancho,
      arriba: contenedor.offsetTop + y,
      abajo: contenedor.offsetTop + y + alto
    };
    const muyCerca = puestos.some(function (otro) {
      const distancia = (tipo.tipo === 'doble' || otro.tipo === 'doble')
        ? DISTANCIA_DOBLE : DISTANCIA_NORMAL;
      return chocan(enPagina, otro.rect, distancia);
    });
    if (muyCerca) continue;

    // Lugar bueno: se crea la imagen
    const img = document.createElement('img');
    img.src = tipo.src;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.className = 'deco';
    img.style.width = ancho + 'px';
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    img.style.setProperty('--giro', numeroAzar(-25, 25) + 'deg');
    img.style.animationDelay = '0s, ' + numeroAzar(0, 3) + 's';
    contenedor.appendChild(img);

    puestos.push({ el: img, tipo: tipo.tipo, contenedor: contenedor, rect: enPagina });
    return true;
  }

  return false; // no hubo lugar: mejor sin estrella que tapando algo
}

// Quita y vuelve a colocar las estrellas de un contenedor
function decorar(contenedor, cantidad, selector) {
  puestos = puestos.filter(function (p) {
    if (p.contenedor === contenedor) {
      p.el.remove();
      return false;
    }
    return true;
  });

  const obstaculos = medirObstaculos(contenedor, selector);
  for (let i = 0; i < cantidad; i++) {
    colocarDetalle(contenedor, obstaculos);
  }
}

function decorarTodo() {
  puestos.forEach(function (p) { p.el.remove(); });
  puestos = [];

  const celular = window.innerWidth <= 768;
  decorar(document.querySelector('.hero'), celular ? 3 : 5, OBSTACULOS_HERO);
  document.querySelectorAll('.seccion').forEach(function (seccion) {
    decorar(seccion, 2, OBSTACULOS_SECCION);
  });
}

// Se colocan cuando ya cargaron imágenes y fuentes (para medir bien)
window.addEventListener('load', function () {
  const fuentes = document.fonts ? document.fonts.ready : Promise.resolve();
  fuentes.then(decorarTodo);
});

// Si cambia el ancho de la ventana, se vuelven a acomodar
let anchoAnterior = window.innerWidth;
let temporizador;
window.addEventListener('resize', function () {
  clearTimeout(temporizador);
  temporizador = setTimeout(function () {
    if (window.innerWidth !== anchoAnterior) {
      anchoAnterior = window.innerWidth;
      decorarTodo();
    }
  }, 250);
});

// Al mostrar/ocultar el dato curioso cambia el tamaño de "Sobre mí",
// así que se vuelven a acomodar las estrellas de esa sección
btnDato.addEventListener('click', function () {
  decorar(document.getElementById('sobre-mi'), 2, OBSTACULOS_SECCION);
});

// ---------- 5. Año automático en el pie de página ----------
document.getElementById('anio').textContent = new Date().getFullYear();
