# Matriz de trazabilidad — investigación de campo a producto

El PDF `matriz-trazabilidad.pdf` no estaba en el repositorio. Esta matriz deja por escrito el vínculo que el README del primer entregable ya registraba, para que la FE-01 del segundo entregable corresponda a un hallazgo concreto y no a una pantalla decorativa.

| Id | Hallazgo (primer entregable) | Quién lo reportó | Prioridad | Dónde quedó |
| --- | --- | --- | --- | --- |
| H-01 | El catálogo semanal se anuncia en cartelera y la gente hace fila para saber qué queda. Cuando llegan, lo de más rotación ya se agotó. | Compradores del mercado campesino y de la cafetería del TdeA (estudiantes y personal) | Alta. Es el hallazgo de información que el catálogo del primer entregable no cierra: consultar no avisa que algo se está acabando. | **FE-01** Alertas de stock (`src/domain/alertasStock.js`, pantalla Alertas de stock, acción “Seguir disponibilidad”). |
| H-02 | El pedido se arma sin señal y los precios cambian. | Compradores en la zona del mercado, donde la señal falla | Alta, pero es el requisito transversal de modo offline, no la funcionalidad emergente. | Modo offline del segundo entregable: caché, carrito persistido, indicador de conexión y cola de sincronización. |

## FE-01 en una frase

La persona marca los productos que le importan y la app le dice, con red o con la última copia descargada, si todavía hay, si queda poco (5 o menos) o si ya se agotó.
