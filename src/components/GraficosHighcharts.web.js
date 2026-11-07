/**
 * Gráficas de las métricas del administrador en el navegador.
 * Se carga Highcharts desde el CDN la primera vez; si el script todavía no
 * está listo, se dibuja cuando termina de cargar.
 */
import React, { useEffect, useRef } from "react";

const COLORES = ["#2E7D32", "#E6A700", "#1976D2", "#8E44AD"];

export default function GraficosHighcharts({
  pedidosPorEstado = {},
  productosPopulares = [],
  camposFormulario = {},
}) {
  const estadoRef = useRef(null);
  const popularRef = useRef(null);
  const camposRef = useRef(null);

  useEffect(() => {
    let vivo = true;

    function dibujar() {
      if (!vivo || !window.Highcharts) return;

      window.Highcharts.chart(estadoRef.current, {
        chart: { type: "column", backgroundColor: "#fff" },
        title: { text: "Pedidos por estado" },
        xAxis: { categories: Object.keys(pedidosPorEstado) },
        yAxis: { min: 0, title: { text: "Pedidos" } },
        series: [
          {
            name: "Pedidos",
            data: Object.values(pedidosPorEstado),
            color: "#2E7D32",
          },
        ],
        credits: { enabled: false },
      });

      const generos = [...new Set(productosPopulares.map(p => p.genero))];
      const nombres = [...new Set(productosPopulares.map(p => p.producto))];

      window.Highcharts.chart(popularRef.current, {
        chart: { type: "bar", backgroundColor: "#fff" },
        title: { text: "10 productos más comprados por género" },
        xAxis: { categories: nombres },
        yAxis: { min: 0, title: { text: "Unidades compradas" } },
        series: generos.map((genero, i) => ({
          name: genero,
          color: COLORES[i % COLORES.length],
          data: nombres.map(nombre => {
            const fila = productosPopulares.find(p => p.producto === nombre && p.genero === genero);
            return fila?.cantidad || 0;
          }),
        })),
        credits: { enabled: false },
      });

      const contenedores = camposRef.current?.querySelectorAll("[data-highchart]") || [];
      contenedores.forEach(elemento => {
        const valores = JSON.parse(decodeURIComponent(elemento.dataset.values || "%7B%7D"));
        window.Highcharts.chart(elemento, {
          chart: { type: "column", backgroundColor: "#fff" },
          title: { text: `${elemento.dataset.entidad}: ${elemento.dataset.campo}` },
          xAxis: { categories: Object.keys(valores), labels: { rotation: -35 } },
          yAxis: { min: 0, title: { text: "Registros" } },
          series: [
            {
              name: "Registros",
              data: Object.values(valores),
              color: "#2E7D32",
            },
          ],
          credits: { enabled: false },
        });
      });
    }

    if (window.Highcharts) {
      dibujar();
    } else {
      const script = document.createElement("script");
      script.src = "https://code.highcharts.com/highcharts.js";
      script.onload = dibujar;
      document.head.appendChild(script);
    }

    return () => {
      vivo = false;
    };
  }, [pedidosPorEstado, productosPopulares, camposFormulario]);

  const campos = Object.entries(camposFormulario).flatMap(([entidad, valores]) =>
    Object.entries(valores)
      .filter(([, contenido]) => contenido && typeof contenido === "object")
      .map(([campo, contenido]) => (
        <div
          key={`${entidad}-${campo}`}
          data-highchart="true"
          data-entidad={entidad}
          data-campo={campo}
          data-values={encodeURIComponent(JSON.stringify(contenido))}
          style={{ height: 260, marginTop: 12, background: "white" }}
        />
      ))
  );

  return (
    <>
      <div ref={estadoRef} style={{ height: 300, marginTop: 14, background: "white" }} />
      <div ref={popularRef} style={{ height: 420, marginTop: 14, background: "white" }} />
      <div ref={camposRef}>{campos}</div>
    </>
  );
}
