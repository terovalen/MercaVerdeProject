# Guía de ejecución de pruebas — MercaVerde

Fecha: 6 de noviembre de 2026

Esta guía es el orden en el que conviene probar, para no repetir pasos. Cada punto de la secuencia va con los IDs de la matriz (`docs/PRUEBAS_MATRIZ.md`), así se puede ir marcando la evidencia mientras se avanza.

---

## 1. Antes de empezar

### En la PC

- [ ] Node.js 18 o superior
- [ ] Dependencias instaladas: `npm install` en la raíz y `cd api && npm install`
- [ ] API arriba: `cd api && npm start` (puerto 3001)
- [ ] `http://localhost:3001/health` responde `{"ok":true}`
- [ ] Firewall de Windows: deja entrar el 3001 (API) y el 8081 (Metro)

### En los iPhones

- [ ] Expo Go en los dos
- [ ] Los dos en el mismo Wi-Fi que la PC (en la última pruebas la IP de la PC era `192.168.10.18`)
- [ ] Datos móviles apagados mientras se prueba
- [ ] Sin VPN

### Sesión de Expo

Con Expo Go 57 o más, la CLI de la PC y el Expo Go del celular tienen que estar en la misma cuenta:

```powershell
# En la PC (una vez):
npx expo login
npx expo whoami
```

Y en **cada iPhone**: Expo Go → ícono de cuenta → Log in con esa misma cuenta.

### Levantar la app

```powershell
# En la PC, desde la raíz:
Ctrl+C              # si Expo ya estaba corriendo
npm start -- --clear
```

- Escanear el QR con los dos iPhones.
- Para la versión web: tecla `w` en la terminal de Expo y abrir `http://192.168.10.18:8081` en el navegador.

---

## 2. Orden de las pruebas

### Fase A — Catálogo (comprador, iPhone 1)

1. Entrar con la cuenta de comprador.
2. Ver que el catálogo carga (CT-01).
3. Ver que no hay stock ni "agotado" (CT-02).
4. Filtros y búsqueda (CT-03, CT-04).
5. Ficha del producto y agregar al carrito (CT-05, CT-06).
6. Que "Ver pedido" se esconda con el carrito vacío y aparezca con productos (CT-07, CT-08).

### Fase B — Inventario (vendedor, iPhone 2)

1. Entrar con la cuenta de vendedor o administrador.
2. Ver el inventario (IV-01).
3. Crear un producto (IV-02).
4. Editarlo (IV-03).
5. Stock con +/− y escrito (IV-04, IV-05).
6. Archivar y restaurar (IV-06, IV-07).

### Fase C — Pedidos, pagos y sustituciones

1. iPhone 1: confirmar un pedido pidiendo más de lo que hay → tiene que fallar (PD-02).
2. iPhone 1: confirmar un pedido que sí alcanza (PD-01).
3. iPhone 1: en la tarjeta del pedido, pagar y revisar el comprobante (PG-01 a PG-06).
4. iPhone 2: ver el ticket, confirmar que dice "Pagado" y preparar el pedido (PD-03, PD-04, PG-07, PG-08).
5. iPhone 2: proponer una sustitución (SU-01 a SU-04).
6. iPhone 1: ver la propuesta y aceptar o rechazar (SU-05, SU-06, SU-07).
7. iPhone 2: eliminar un pedido (PD-08).
8. iPhone 1: ver el aviso de eliminación (PD-09).

### Fase D — API y red

1. Endpoints con Postman o con el navegador (AP-01 a AP-08).
2. Modo avión y reconexión (RD-01 a RD-04).
3. Campos inválidos (RD-05).
4. URL de imagen que no existe (RD-06).

### Fase E — Los dos celulares a la vez

1. Ambos operando al tiempo (MD-01, MD-02, MD-03).

---

## 3. Cómo anotar un error

Va en `docs/REGISTRO_ERRORES.md`, con este formato:

```
## INC-XXX
Fecha: DD/MM/AAAA
Módulo: ...
Dispositivo: iPhone 1 / iPhone 2 / Web
Gravedad: Crítica / Alta / Media / Baja
Qué pasó: ...
Pasos para reproducir: ...
Se esperaba: ...
Salió: ...
Evidencia: ...
Estado: Abierto
```

---

## 4. Criterios para dar el entregable por bueno

- [ ] Pasan los casos críticos: CT-01, CT-06, IV-01, IV-02, PD-01, PD-03, PG-05, SU-01 y SU-04
- [ ] No queda ningún error de gravedad crítica abierto
- [ ] El comprador nunca ve existencias en las respuestas de la API
- [ ] El flujo de sustitución funciona sin escribir IDs
- [ ] La versión web carga y se puede usar
- [ ] Se puede grabar el video con todos los flujos funcionando

---

## 5. Comandos que sirven

```powershell
# Ver si la API responde
http://192.168.10.18:3001/health

# Ver qué está en los puertos
Get-NetTCPConnection -LocalPort 3001 -State Listen
Get-NetTCPConnection -LocalPort 8081 -State Listen

# Liberar los puertos si quedan ocupados
taskkill /F /IM node.exe

# Reiniciar Expo con la caché limpia
npm start -- --clear

# Ver con qué cuenta está la CLI
npx expo whoami
```
