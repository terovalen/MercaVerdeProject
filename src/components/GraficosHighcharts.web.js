import React, { useEffect, useRef } from "react";

export default function GraficosHighcharts({ pedidosPorEstado = {}, productosPopulares = [], camposFormulario = {} }) {
  const estadoRef = useRef(null);
  const popularRef = useRef(null);
  const camposRef = useRef(null);
  useEffect(() => {
    let activo = true;
    const crear = () => {
      if (!activo || !window.Highcharts) return;
      window.Highcharts.chart(estadoRef.current, {
        chart: { type: "column", backgroundColor: "#fff" }, title: { text: "Pedidos por estado" },
        xAxis: { categories: Object.keys(pedidosPorEstado) }, yAxis: { min: 0, title: { text: "Pedidos" } },
        series: [{ name: "Pedidos", data: Object.values(pedidosPorEstado), color: "#2E7D32" }], credits: { enabled: false },
      });
      const generos = [...new Set(productosPopulares.map(p => p.genero))];
      const nombres = [...new Set(productosPopulares.map(p => p.producto))];
      window.Highcharts.chart(popularRef.current, {
        chart: { type: "bar", backgroundColor: "#fff" }, title: { text: "10 productos más comprados por género" },
        xAxis: { categories: nombres }, yAxis: { min: 0, title: { text: "Unidades compradas" } },
        series: generos.map((genero, index) => ({ name: genero, color: ["#2E7D32", "#E6A700", "#1976D2", "#8E44AD"][index % 4], data: nombres.map(nombre => productosPopulares.find(p => p.producto === nombre && p.genero === genero)?.cantidad || 0) })),
        credits: { enabled: false },
      });
      camposRef.current?.querySelectorAll("[data-highchart]").forEach(element => {
        const valores = JSON.parse(decodeURIComponent(element.dataset.values || "%7B%7D"));
        window.Highcharts.chart(element, {
          chart: { type: "column", backgroundColor: "#fff" }, title: { text: `${element.dataset.entidad}: ${element.dataset.campo}` },
          xAxis: { categories: Object.keys(valores), labels: { rotation: -35 } }, yAxis: { min: 0, title: { text: "Registros" } },
          series: [{ name: "Registros", data: Object.values(valores), color: "#2E7D32" }], credits: { enabled: false },
        });
      });
    };
    if (window.Highcharts) crear();
    else {
      const script = document.createElement("script"); script.src = "https://code.highcharts.com/highcharts.js"; script.onload = crear; document.head.appendChild(script);
    }
    return () => { activo = false; };
  }, [pedidosPorEstado, productosPopulares, camposFormulario]);
  return <><div ref={estadoRef} style={{ height: 300, marginTop: 14, background: "white" }} /><div ref={popularRef} style={{ height: 420, marginTop: 14, background: "white" }} /><div ref={camposRef}>{Object.entries(camposFormulario).flatMap(([entidad, campos]) => Object.entries(campos).filter(([, valores]) => valores && typeof valores === "object").map(([campo, valores]) => <div key={`${entidad}-${campo}`} data-highchart="true" data-entidad={entidad} data-campo={campo} data-values={encodeURIComponent(JSON.stringify(valores))} style={{ height: 260, marginTop: 12, background: "white" }} />))}</div></>;
}
