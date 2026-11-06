/**
 * Sistema de avisos y confirmaciones que SÍ se ven también en la versión
 * web (Alert de React Native no se muestra en el navegador: las
 * confirmaciones de la propuesta de reemplazo quedaban sin respuesta).
 * Devuelve la caja de diálogo lista para renderizar y las funciones
 * avisar()/confirmar(); sigue el patrón de Dialogo + MisPedidosScreen.
 */
import React, { useState } from "react";
import Dialogo from "./Dialogo";

export default function usarDialogos() {
  const [dialogo, setDialogo] = useState(null);

  /** Aviso de un solo botón. `alCerrar` corrida al tocar "Aceptar". */
  function avisar(titulo, mensaje, alCerrar) {
    setDialogo({
      titulo,
      mensaje,
      textoConfirmar: "Aceptar",
      onConfirmar: () => {
        setDialogo(null);
        alCerrar?.();
      },
    });
  }

  /**
   * Confirmación de dos botones que responde con true/false.
   * Las reglas de la acción se quedan en la pantalla; esto solo pregunta.
   */
  function confirmar(titulo, mensaje, opciones = {}) {
    return new Promise((resolver) => {
      setDialogo({
        titulo,
        mensaje,
        textoConfirmar: opciones.textoConfirmar || "Aceptar",
        textoCancelar: opciones.textoCancelar ?? "Cancelar",
        onConfirmar: () => {
          setDialogo(null);
          resolver(true);
        },
        onCancelar: () => {
          setDialogo(null);
          resolver(false);
        },
      });
    });
  }

  const caja = (
    <Dialogo
      visible={Boolean(dialogo)}
      titulo={dialogo?.titulo}
      mensaje={dialogo?.mensaje}
      textoConfirmar={dialogo?.textoConfirmar}
      textoCancelar={dialogo?.textoCancelar}
      onConfirmar={dialogo?.onConfirmar}
      onCancelar={dialogo?.onCancelar}
    />
  );

  return { caja, avisar, confirmar, cerrar: () => setDialogo(null) };
}
