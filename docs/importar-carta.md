# Cargar una carta desde archivo

En la consola, dentro de cada negocio, la sección **Cargar carta desde archivo** acepta un CSV (pegado o subido). Antes de cargar muestra cómo queda la carta y las líneas con errores. Si hay errores, no carga nada.

- **Agregar a la carta actual:** suma los productos; si una categoría ya existe con el mismo nombre (sin importar acentos o mayúsculas), los pone ahí.
- **Reemplazar la carta completa:** borra lo que había y deja solo lo del archivo.
- Se publica al instante y queda en la auditoría.
- Las fotos no entran por archivo: se suben después en el admin, producto por producto.
- Límites: 300 productos, 30 categorías y 6 variantes por producto.

## Formato

Primera línea con los encabezados. Separador coma (también acepta punto y coma o tabulador, como exporta Excel en español). Si un texto lleva comas, va entre comillas.

| Columna | Obligatoria | Ejemplo | Notas |
|---|---|---|---|
| `categoria` | Sí | `Mezcales` | Las categorías se crean en el orden en que aparecen |
| `producto` | Sí | `Espadín` | |
| `descripcion` | No | `"Joven, de Oaxaca"` | Máximo 280 caracteres |
| `precio` | Sí, salvo que haya variantes | `90` o `90.50` | Solo el número, sin `$` ni `MXN` |
| `variantes` | No | `Copa:90\|Botella:1200` | `Nombre:precio` separados por `\|`; el precio del producto es el de la primera |
| `etiquetas` | No | `picante\|vegetariano` | `picante`, `vegetariano`, `vegano`, `sin-gluten`, `nuevo` |
| `disponible` | No | `si` | `no` lo muestra como agotado; vacío = `si` |
| `favorito` | No | `si` | Recomendado de la casa: lleva una etiqueta discreta junto al nombre (máximo 8); vacío = `no` |

```csv
categoria,producto,descripcion,precio,variantes,etiquetas,disponible,favorito
Botanas,Guacamole con totopos,"Aguacate, chile serrano y cilantro",95,,vegetariano,si
Mezcales,Espadín,Joven de Oaxaca,,Copa:90|Botella:1200,,si
Bebidas sin alcohol,Agua de jamaica,,,Vaso:45|Jarra:120,,si
```

## Prompt para generar el archivo con Claude

Adjunta fotos o el PDF de la carta del negocio y pega esto:

````
Convierte la carta adjunta en un CSV para importarla en Nir. Responde solo con un bloque ```csv, sin explicaciones.

Reglas:
- Encabezado exacto: categoria,producto,descripcion,precio,variantes,etiquetas,disponible,favorito
- Una fila por producto, en el mismo orden de la carta. Respeta los nombres de las categorías como aparecen (por ejemplo "Entradas", "Tacos", "Mezcales").
- precio: solo el número en pesos, con punto decimal si lleva centavos (85 o 85.50). Sin $, sin "MXN", sin comas de miles.
- Si un producto tiene varios tamaños o presentaciones con precio distinto (copa/botella, chico/grande, 1/2 orden/orden), deja precio vacío y escribe variantes como Nombre:precio separadas por | (ejemplo: Copa:90|Botella:1200). Máximo 6.
- descripcion: copia la descripción de la carta si existe; si no, déjala vacía. No inventes descripciones.
- etiquetas: solo si la carta lo indica, usando únicamente picante, vegetariano, vegano, sin-gluten o nuevo, separadas por |.
- disponible: siempre si.
- favorito: déjalo vacío (el dueño elige sus recomendados después).
- Encierra entre comillas dobles cualquier texto que lleve comas.
- No inventes productos ni precios. Si un precio no se lee, escribe el producto con precio 0 y al final del bloque agrega una línea que empiece con # indicando cuáles revisar.
- Si un mismo producto aparece en dos categorías, ponlo en ambas.
````

Revisa la vista previa en la consola antes de cargar: las líneas que empiezan con `#` se marcan como error para que corrijas esos precios.
