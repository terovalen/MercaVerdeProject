# Matriz de trazabilidad — investigación de campo a producto

El PDF `matriz-trazabilidad.pdf` no estaba en el repositorio. Esta matriz deja por escrito el vínculo que el README del primer entregable ya registraba, para que la FE-01 del segundo entregable corresponda a un hallazgo concreto y no a una pantalla decorativa.

| Id | Hallazgo (primer entregable) | Quién lo reportó | Prioridad | Dónde quedó |
| --- | --- | --- | --- | --- |
| H-01 | El catálogo semanal se anuncia en cartelera y la gente hace fila para saber qué queda. Cuando llegan, lo de más rotación ya se agotó. | Compradores del mercado campesino y de la cafetería del TdeA (estudiantes y personal) | Alta. Es el hallazgo de información que el catálogo del primer entregable no cierra: consultar no avisa que algo se está acabando. | **FE-01** Seguimiento de disponibilidad en la ficha del producto (botón “Seguir disponibilidad”). |
| H-02 | El pedido se arma sin señal y los precios cambian. | Compradores en la zona del mercado, donde la señal falla | Alta, pero es el requisito transversal de modo offline, no la funcionalidad emergente. | Modo offline del segundo entregable: caché, carrito persistido, indicador de conexión y cola de sincronización. |

## FE-01 en una frase

La persona marca en la ficha del producto los que le importan, para volver a ellos sin buscarlos otra vez en el catálogo.

## Cambio de última hora

Había también una pantalla de “Alertas de stock” en el menú del comprador. Se quitó porque el módulo de inventario exige que el comprador nunca vea las existencias, y una lista que dice “queda poco” es justamente una forma de mostrar el stock. La acción de seguir un producto se quedó en la ficha del producto, que es la parte de FE-01 que no contradice esa regla.
