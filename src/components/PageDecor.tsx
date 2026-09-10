/**
 * Capa ambiental fija con manchas de color.
 *
 * Antes: Framer Motion con `useScroll` + `useSpring` recalculando la posición
 * de cada mancha en cada frame de scroll (en el hilo principal, con `blur`
 * grande = repintados caros).
 *
 * Ahora: markup estático. El parallax al hacer scroll lo hace CSS con
 * `animation-timeline: scroll()` donde exista soporte (compositor, cero JS);
 * en el resto las manchas quedan quietas.
 */
export default function PageDecor() {
  return (
    <div aria-hidden className="page-decor">
      <div className="page-decor__blob page-decor__blob--1" />
      <div className="page-decor__blob page-decor__blob--2" />
      <div className="page-decor__blob page-decor__blob--3" />
    </div>
  );
}
