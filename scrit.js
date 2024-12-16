// RequestAnimationFrame compatibilidad
window.requestAnimFrame = function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
}();

// Variables globales
let canvas, c, w, h;
let mouse = { x: false, y: false }, last_mouse = {};
let target = { x: 0, y: 0 }, last_target = { x: 0, y: 0 };
let t = 0, q = 10;
let tent = [], clicked = false;
const maxL = 300, minL = 50, n = 30, numt = 500, proximityThreshold = 200; // Umbral de proximidad

// Inicialización del canvas
function init(elemId) {
  canvas = document.getElementById(elemId);
  c = canvas.getContext("2d");
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

// Clase segmento
class Segment {
  constructor(parent, l, a, first) {
    this.l = l;
    this.ang = a;
    this.first = first;

    if (first) {
      this.pos = { x: parent.x, y: parent.y };
    } else {
      this.pos = { x: parent.nextPos.x, y: parent.nextPos.y };
    }

    this.nextPos = {
      x: this.pos.x + this.l * Math.cos(this.ang),
      y: this.pos.y + this.l * Math.sin(this.ang),
    };
  }

  update(t) {
    this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
    this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
    this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);

    this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
    this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
  }

  fallback(t) {
    this.pos.x = t.x;
    this.pos.y = t.y;
    this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
    this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
  }

  show() {
    c.lineTo(this.nextPos.x, this.nextPos.y);
  }
}

// Clase tentáculo
class Tentacle {
  constructor(x, y, l, n) {
    this.x = x;
    this.y = y;
    this.l = l;
    this.n = n;
    this.t = {};
    this.rand = Math.random();
    this.segments = [new Segment(this, this.l / this.n, 0, true)];
    for (let i = 1; i < this.n; i++) {
      this.segments.push(
        new Segment(this.segments[i - 1], this.l / this.n, 0, false)
      );
    }
  }

  move(last_target, target) {
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.dt = Math.sqrt(
      Math.pow(last_target.x - target.x, 2) +
        Math.pow(last_target.y - target.y, 2)
    );
    this.t = {
      x: target.x - 0.8 * this.dt * Math.cos(this.angle),
      y: target.y - 0.8 * this.dt * Math.sin(this.angle),
    };

    this.segments[this.n - 1].update(this.t);
    for (let i = this.n - 2; i >= 0; i--) {
      this.segments[i].update(this.segments[i + 1].pos);
    }

    if (Math.sqrt((this.x - target.x) ** 2 + (this.y - target.y) ** 2) <= this.l) {
      this.segments[0].fallback({ x: this.x, y: this.y });
      for (let i = 1; i < this.n; i++) {
        this.segments[i].fallback(this.segments[i - 1].nextPos);
      }
    }
  }

  show(target) {
    // Calculamos la distancia desde el mouse hasta el tentáculo
    const distance = Math.sqrt(Math.pow(this.x - target.x, 2) + Math.pow(this.y - target.y, 2));
    
    // Si la distancia es menor que el umbral de proximidad, mostramos el tentáculo (líneas)
    if (distance < proximityThreshold) {
      c.globalCompositeOperation = "lighter";
      c.beginPath();
      c.lineTo(this.x, this.y);
      for (let i = 0; i < this.n; i++) this.segments[i].show();
      c.strokeStyle = `hsl(${this.rand * 60 + 180},100%,${this.rand * 60 + 25}%)`;
      c.lineWidth = this.rand * 2;
      c.stroke();
      c.globalCompositeOperation = "source-over";
    }
  }

  show2(target) {
    // Mostrar todos los puntos, sin importar la proximidad
    c.beginPath();
    c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
    c.fillStyle = "white";
    c.fill();
  }
}

// Inicialización
init("canvas");
for (let i = 0; i < numt; i++) {
  tent.push(
    new Tentacle(
      Math.random() * w,
      Math.random() * h,
      Math.random() * (maxL - minL) + minL,
      n
    )
  );
}

// Función de dibujo principal
function draw() {
  if (mouse.x) {
    target.x += (mouse.x - target.x) / 10;
    target.y += (mouse.y - target.y) / 10;
  }
  t += 0.01;

  c.beginPath();
  c.arc(target.x, target.y, 10, 0, 2 * Math.PI);
  c.fillStyle = "hsl(210,100%,80%)";
  c.fill();

  for (let i = 0; i < numt; i++) {
    tent[i].move(last_target, target);
    tent[i].show2(target);  // Mostrar siempre los puntos
    tent[i].show(target);    // Mostrar tentáculo solo si está cerca
  }
  last_target.x = target.x;
  last_target.y = target.y;
}

// Eventos
canvas.addEventListener("mousemove", function (e) {
  mouse.x = e.pageX;
  mouse.y = e.pageY;
});

window.addEventListener("resize", function () {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  c = canvas.getContext("2d");
});

// Bucle principal
function loop() {
  window.requestAnimFrame(loop);
  c.clearRect(0, 0, w, h);
  draw();
}
loop();

