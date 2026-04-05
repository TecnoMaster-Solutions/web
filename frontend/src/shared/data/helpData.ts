export const helpModules = [


{
  id: "usuarios",
  name: "Usuarios",
  description:
    "Este módulo permite administrar la información de los usuarios del sistema, facilitando su registro, consulta, actualización y eliminación según las necesidades de la plataforma.",

  tutorials: [
    {
      title: "Registrar usuario",
      description:
        "Este proceso permite crear un nuevo usuario en el sistema registrando su información general y asignando los datos necesarios para su acceso.",

      steps: [
        "Haz clic en el botón Crear Usuario.",
        "Completa los campos obligatorios del formulario.",
        "Selecciona el rol correspondiente.",
        "Verifica la información registrada.",
        "Haz clic en Guardar para crear el usuario.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1VDDH97auadpyZug9_WmqlaKiQnmURhVQ/preview",

      note:
        "El sistema impide guardar el formulario si hay campos obligatorios sin completar o si la información registrada no cumple con las validaciones establecidas.",
    },

    {
      title: "Buscar usuario",
      description:
        "Este proceso permite localizar un usuario específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Usuarios.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre o dato del usuario que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1qMGZ_cz5gkhGU5y8VUwtiiThCznS6xtC/preview",
    },

    {
      title: "Editar usuario",
      description:
        "Este proceso permite modificar la información de un usuario registrado para mantener sus datos actualizados dentro del sistema.",

      steps: [
        "Ubica el usuario que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el usuario.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1bDvAowBMhOL-kNcq-gHdRhJWevtOhGzJ/preview",

      note:
        "Los cambios realizados sobre la información del usuario se aplican una vez se guarde correctamente el formulario.",
    },

    {
      title: "Ver detalle de usuario",
      description:
        "Este proceso permite visualizar la información detallada de un usuario registrado en el sistema.",

      steps: [
        "Ubica el usuario en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados del usuario.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1nNcG1guM6raAjquLhFsFUbRfqWkCcmUc/preview",
    },

    {
      title: "Eliminar usuario",
      description:
        "Este proceso permite eliminar un usuario del sistema cuando ya no es necesario mantener su registro.",

      steps: [
        "Ubica el usuario que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1g0vTxNagD1knNm3L8yBWPG50hyo_kssu/preview",

      note:
        "Se recomienda verificar que el usuario no tenga procesos pendientes antes de realizar su eliminación.",
    },
  ],
},

{
  id: "roles",
  name: "Roles",
  description:
    "Este módulo permite administrar los roles del sistema, definiendo los permisos que controlan el acceso a las funcionalidades disponibles para cada tipo de usuario.",

  tutorials: [
    {
      title: "Registrar rol",
      description:
        "Este proceso permite crear un nuevo rol asignando los permisos necesarios para definir qué acciones podrá realizar dentro del sistema.",

      steps: [
        "Haz clic en el botón Crear Rol.",
        "Ingresa el nombre del rol.",
        "Selecciona los permisos que deseas asignar.",
        "Verifica la información registrada.",
        "Haz clic en Guardar para crear el rol.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1QiqkRZ9hFG0HYCQwtbCjsGWUlOUKnMta/preview",

    },

    {
      title: "Buscar rol",
      description:
        "Este proceso permite localizar un rol específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Roles.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre del rol que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1Mfpf9BELMc2cjM6Saq_0o_DZrbMORAgN/preview",
    },

    {
      title: "Editar rol",
      description:
        "Este proceso permite modificar la información de un rol existente, incluyendo su nombre y los permisos asignados.",

      steps: [
        "Ubica el rol que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza el nombre o los permisos necesarios.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el rol.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1HGAPu9kauVtlegfe2GAJ43b3L0ieepcT/preview",

    },

    {
      title: "Ver detalle de rol",
      description:
        "Este proceso permite visualizar la información detallada de un rol, incluyendo los permisos que tiene asignados.",

      steps: [
        "Ubica el rol en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información mostrada del rol.",
        "Consulta los permisos asociados.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1kwk7Q8-aGwTZANOjcCvPJHmMqj2Y4rix/preview",
    },

    {
      title: "Eliminar rol",
      description:
        "Este proceso permite eliminar un rol del sistema cuando ya no es necesario.",

      steps: [
        "Ubica el rol que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1FHuBupyHdAKiX3tap5SCFg_uh24tAHmT/preview",

    },
  ],
},

{
  id: "proveedores",
  name: "Proveedores",
  description:
    "Este módulo permite administrar la información de los proveedores del sistema, facilitando su registro, consulta, actualización y control de su estado dentro de la plataforma.",

  tutorials: [
    {
      title: "Registrar proveedor",
      description:
        "Este proceso permite crear un nuevo proveedor registrando su información general para su uso en los procesos del sistema.",

      steps: [
        "Haz clic en el botón Crear Proveedor.",
        "Completa los campos obligatorios del formulario.",
        "Verifica la información registrada.",
        "Haz clic en Guardar para crear el proveedor.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1e1Nu7H37Sgl0d-u02JjWw15Ai2-Soxzb/preview",

      note:
        "El sistema impide guardar el formulario si hay campos obligatorios sin completar o si la información registrada no cumple con las validaciones establecidas.",
    },

    {
      title: "Buscar proveedor",
      description:
        "Este proceso permite localizar un proveedor específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Proveedores.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre o dato del proveedor que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/17opHkk9-5D4nOWzWc_b_XTYc93yZr_ck/preview",
    },

    {
      title: "Editar proveedor",
      description:
        "Este proceso permite modificar la información de un proveedor registrado para mantener sus datos actualizados dentro del sistema.",

      steps: [
        "Ubica el proveedor que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el proveedor.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1zgnq4BBqKHBN4BwAkx0oRtwi0SQVT2IL/preview",

      note:
        "Los cambios realizados se aplican una vez se guarde correctamente la información del proveedor.",
    },

    {
      title: "Ver detalle de proveedor",
      description:
        "Este proceso permite visualizar la información detallada de un proveedor registrado en el sistema.",

      steps: [
        "Ubica el proveedor en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados del proveedor.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1_wsg0osy5ew5_FQrrZ5RqUNNxRBPvBDm/preview",
    },

    {
      title: "Desactivar proveedor",
      description:
        "Este proceso permite cambiar el estado de un proveedor a inactivo, evitando que sea utilizado en nuevos procesos sin eliminar su información del sistema.",

      steps: [
        "Ubica el proveedor que deseas desactivar.",
        "Haz clic en el botón de desactivar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1hbbXYMWVUI43V4qd--O5GcxGAJBgWbDa/preview",

      note:
        "La desactivación de un proveedor no elimina su información, pero impide su uso en nuevos registros dentro del sistema.",
    },
  ],
},

{
  id: "compras",
  name: "Compras",
  description:
    "Este módulo permite gestionar las compras del sistema, registrando productos adquiridos, proveedores asociados y controlando su estado, ya sea mediante órdenes de compra o de forma directa.",

  tutorials: [
    {
      title: "Crear compra sin orden de compra",
      description:
        "Este proceso permite registrar una compra de manera manual, seleccionando el proveedor y agregando los productos directamente al carrito.",

      steps: [
        "Haz clic en el botón Crear Compra.",
        "Selecciona el proveedor.",
        "Agrega los productos al carrito.",
        "Ingresa la cantidad y el precio de cada producto.",
        "Verifica la información registrada.",
        "Haz clic en Guardar para registrar la compra.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1tWIjzGHQpZ2fWDwB00ncZPdxDNe7JDZD/preview",

      note:
        "El sistema impide guardar la compra si no se ha seleccionado un proveedor o si no se ha agregado al menos un producto.",
    },

    {
      title: "Crear compra con orden de compra",
      description:
        "Este proceso permite registrar una compra a partir de una orden de compra previamente creada, cargando automáticamente los productos asociados.",

      steps: [
        "Haz clic en el botón Crear Compra.",
        "Selecciona el proveedor.",
        "Selecciona la orden de compra correspondiente.",
        "Verifica que los productos se carguen automáticamente en el carrito.",
        "Revisa la información de cantidades y precios.",
        "Haz clic en Guardar para registrar la compra.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1S7lC6nPgFxi5kk_bllmJcJ6oIR1wmTg-/preview",

      note:
        "Cuando se selecciona una orden de compra, los productos se cargan automáticamente y no deben agregarse manualmente.",
    },

    {
      title: "Buscar compra",
      description:
        "Este proceso permite localizar una compra específica dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Compras.",
        "Ubica el campo de búsqueda.",
        "Ingresa el número de orden, proveedor o dato relacionado.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1LR-bAwYRA0OF2RMdKZUkhaZegjLJlXTp/preview",
    },

    {
      title: "Ver detalle de compra",
      description:
        "Este proceso permite visualizar la información detallada de una compra, incluyendo los productos registrados y sus valores.",

      steps: [
        "Ubica la compra en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general de la compra.",
        "Consulta los productos, cantidades y precios registrados.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1Tx6yZblXsOnMBcI7JX5J8ccS2BQTuKL9/preview",
    },

    {
      title: "Anular compra",
      description:
        "Este proceso permite cambiar el estado de una compra a anulada, cancelando sus efectos dentro del sistema.",

      steps: [
        "Ubica la compra que deseas anular.",
        "Haz clic en el botón de anular.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1LSEFXrBtJPIECkdX7FbaIZXyKXhOfqpW/preview",

      note:
        "Solo se pueden anular compras en estado aprobado. Esta acción puede afectar el stock de los productos asociados.",
    },
  ],
},

{
  id: "categorias",
  name: "Categorías de productos",
  description:
    "Este módulo permite administrar las categorías de los productos del sistema, facilitando su organización y clasificación dentro de la plataforma.",

  tutorials: [
    {
      title: "Crear categoría",
      description:
        "Este proceso permite registrar una nueva categoría para clasificar los productos dentro del sistema.",

      steps: [
        "Haz clic en el botón Crear Categoría.",
        "Ingresa el nombre de la categoría.",
        "Completa la información requerida.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear la categoría.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1mYfZU6zpxsOwGaMu669JmP6PcE6VlVJB/preview",

      note:
        "El sistema impide guardar la categoría si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar categoría",
      description:
        "Este proceso permite localizar una categoría específica dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Categorías de productos.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre de la categoría que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1IXuVG9ymXNqvxTKBESp6KF2F2_BOBzJB/preview",
    },

    {
      title: "Editar categoría",
      description:
        "Este proceso permite modificar la información de una categoría registrada para mantenerla actualizada.",

      steps: [
        "Ubica la categoría que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar la categoría.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/14szIr0JfaqjSREbaYx-YflfKQvyyuaWc/preview",

      note:
        "Los cambios realizados en la categoría se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de categoría",
      description:
        "Este proceso permite visualizar la información detallada de una categoría registrada en el sistema.",

      steps: [
        "Ubica la categoría en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados de la categoría.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1IotQJ3u5XY7X-LF78otdD79Vj2bi1PJW/preview",
    },

    {
      title: "Eliminar categoría",
      description:
        "Este proceso permite eliminar una categoría del sistema cuando ya no es necesaria.",

      steps: [
        "Ubica la categoría que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1V_ebIXmCUZi4W1x8Wym8XUMABv7Eeu5j/preview",

      note:
        "Se recomienda verificar que la categoría no esté asociada a productos antes de eliminarla para evitar inconsistencias en el sistema.",
    },
  ],
},

{
  id: "productos",
  name: "Productos",
  description:
    "Este módulo permite administrar los productos del sistema, facilitando su registro, consulta, actualización, eliminación y visualización para su posterior uso en procesos como compras y ventas.",

  tutorials: [
    {
      title: "Crear producto",
      description:
        "Este proceso permite registrar un nuevo producto en el sistema, definiendo su información general, categoría y precios.",

      steps: [
        "Haz clic en el botón Crear Producto.",
        "Completa los campos obligatorios del formulario.",
        "Selecciona la categoría correspondiente.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear el producto.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1dBRMUyKtrSwZUHx1YJb5OyxzPmkf1QU5/preview",

      note:
        "El sistema impide guardar el producto si los campos obligatorios no han sido completados correctamente o si los valores ingresados no son válidos.",
    },

    {
      title: "Buscar producto",
      description:
        "Este proceso permite localizar un producto específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Productos.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre o dato del producto que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1G8q4pDC-q-nUaoVEzj9eUMJcEfp5HyQJ/preview",
    },

    {
      title: "Editar producto",
      description:
        "Este proceso permite modificar la información de un producto registrado para mantener sus datos actualizados.",

      steps: [
        "Ubica el producto que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el producto.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1cmYgI-64sKLDjbSbGvbkyG19jhnzzEke/preview",

      note:
        "Los cambios realizados en el producto se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de producto",
      description:
        "Este proceso permite visualizar la información detallada de un producto registrado en el sistema.",

      steps: [
        "Ubica el producto en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados del producto.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1rOVG6ZPbVeHov14YC8kRM-5tNANIRx6T/preview",
    },

    {
      title: "Eliminar producto",
      description:
        "Este proceso permite eliminar un producto del sistema cuando ya no es necesario.",

      steps: [
        "Ubica el producto que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1Dulb8qEhk4Mt84ypEYVDhq6M9wECWuKU/preview",

      note:
        "Se recomienda verificar que el producto no esté asociado a procesos activos antes de eliminarlo para evitar inconsistencias en el sistema.",
    },

    {
      title: "Comprar producto desde la landing",
      description:
        "Este proceso permite a los usuarios visualizar los productos disponibles y realizar la compra directamente desde la página principal del sistema.",

      steps: [
        "Accede a la página principal (landing).",
        "Explora la lista de productos disponibles.",
        "Selecciona el producto que deseas adquirir.",
        "Agrega el producto al carrito.",
        "Seleccionar el botón de Pagar.",
        "Inicia sesión en la plataforma de mercadopago.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1o-rqzwgi8499uU4gVWxuJ_K6aV-wvZ76/preview",

      note:
        "La disponibilidad del producto depende del stock registrado en el sistema.",
    },
  ],
},

{
  id: "servicios",
  name: "Servicios",
  description:
    "Este módulo permite administrar los servicios del sistema, facilitando su registro, consulta, actualización, eliminación y solicitud desde la página principal de la plataforma.",

  tutorials: [
    {
      title: "Crear servicio",
      description:
        "Este proceso permite registrar un nuevo servicio en el sistema, definiendo su información general para que pueda ser gestionado y solicitado posteriormente.",

      steps: [
        "Haz clic en el botón Crear Servicio.",
        "Completa los campos obligatorios del formulario.",
        "Ingresa la información requerida del servicio.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear el servicio.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1N3K97Ldk9wLpxnZ0WpgimdW84blG5V0x/preview",

      note:
        "El sistema impide guardar el servicio si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar servicio",
      description:
        "Este proceso permite localizar un servicio específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Servicios.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre o dato del servicio que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1d5KXc8WcON-ZBKZRLaTmvHWzwxzI1yfu/preview",
    },

    {
      title: "Editar servicio",
      description:
        "Este proceso permite modificar la información de un servicio registrado para mantener sus datos actualizados dentro del sistema.",

      steps: [
        "Ubica el servicio que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el servicio.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1KtVrgOAOPbaoXzttTtheFjDxUvr0LYEq/preview",

      note:
        "Los cambios realizados en el servicio se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de servicio",
      description:
        "Este proceso permite visualizar la información detallada de un servicio registrado en el sistema.",

      steps: [
        "Ubica el servicio en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados del servicio.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/192IcCVFJiASeBNy9m_jPxnTIhn_zfgqr/preview",
    },

    {
      title: "Eliminar servicio",
      description:
        "Este proceso permite eliminar un servicio del sistema cuando ya no es necesario.",

      steps: [
        "Ubica el servicio que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1T71G9LDcFwSi853x1AofVvND1ynLFOo4/preview",

      note:
        "Se recomienda verificar que el servicio no esté asociado a procesos activos antes de eliminarlo para evitar inconsistencias en el sistema.",
    },

    {
      title: "Solicitar servicio desde la landing",
      description:
        "Este proceso permite a los usuarios realizar la solicitud de un servicio directamente desde la página principal del sistema.",

      steps: [
        "Accede a la página principal (landing).",
        "Ubica la sección de servicios disponibles.",
        "Selecciona el servicio que deseas solicitar.",
        "Completa la información requerida en el formulario.",
        "Envía la solicitud según el proceso establecido.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1MJZRdgbjfGzvbOxeEzKIUNhsPVo8xnIw/preview",

      note:
        "La solicitud del servicio debe completarse con la información requerida para que pueda ser procesada correctamente.",
    },
  ],
},

{
  id: "tecnicos",
  name: "Técnicos",
  description:
    "Este módulo permite administrar la información de los técnicos del sistema, facilitando su registro, consulta, actualización y eliminación según las necesidades de la plataforma.",

  tutorials: [
    {
      title: "Crear técnico",
      description:
        "Este proceso permite registrar un nuevo técnico en el sistema, ingresando su información para su posterior asignación en los servicios.",

      steps: [
        "Haz clic en el botón Crear Técnico.",
        "Completa los campos obligatorios del formulario.",
        "Ingresa la información requerida del técnico.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear el técnico.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1YxeEIAf3NpN3sZeITXwWTM1ZgczaAv0i/preview",

      note:
        "El sistema impide guardar el técnico si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar técnico",
      description:
        "Este proceso permite localizar un técnico específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Técnicos.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre o dato del técnico que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/13GBZOfozSz0wWJ4wsz16Ou9DNusSsL-G/preview",
    },

    {
      title: "Editar técnico",
      description:
        "Este proceso permite modificar la información de un técnico registrado para mantener sus datos actualizados dentro del sistema.",

      steps: [
        "Ubica el técnico que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el técnico.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1USqeJGKhiNBURcKCvaJ5Ra14Upyaco24/preview",

      note:
        "Los cambios realizados en el técnico se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de técnico",
      description:
        "Este proceso permite visualizar la información detallada de un técnico registrado en el sistema.",

      steps: [
        "Ubica el técnico en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados del técnico.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1AJTniKPDvA9I2mZ-eR3YCdsEVopLc-Zj/preview",
    },

    {
      title: "Eliminar técnico",
      description:
        "Este proceso permite eliminar un técnico del sistema cuando ya no es necesario.",

      steps: [
        "Ubica el técnico que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/13ruwQhVck9tt-415Lp996AcFRVKlpolG/preview",

      note:
        "Se recomienda verificar que el técnico no esté asignado a procesos activos antes de eliminarlo para evitar inconsistencias en el sistema.",
    },
  ],
},

{
  id: "ventas",
  name: "Ventas",
  description:
    "Este módulo permite gestionar las ventas del sistema, facilitando su registro, consulta, solicitud de pago, aprobación de pago y anulación según el estado del proceso.",

  tutorials: [
    {
      title: "Crear venta",
      description:
        "Este proceso permite registrar una nueva venta en el sistema, asociando los productos seleccionados y la información necesaria para el proceso de pago.",

      steps: [
        "Haz clic en el botón Crear Venta.",
        "Selecciona el cliente y los productos que deseas registrar en la venta.",
        "Completa la información requerida del proceso.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear la venta.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1Q0e3f7Nl_e6jSrvKj_CAOLL0o_v8ri5E/preview",

      note:
        "El sistema impide guardar la venta si no se han agregado productos o si la información requerida no ha sido completada correctamente.",
    },

    {
      title: "Buscar venta",
      description:
        "Este proceso permite localizar una venta específica dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Ventas.",
        "Ubica el campo de búsqueda.",
        "Ingresa el número de venta o dato relacionado que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1gjo_s39QcaZpEpR73NALJQ1FGb3To81v/preview",
    },

    {
      title: "Pedir pago",
      description:
        "Este proceso permite solicitar el pago de una venta registrada para continuar con el flujo comercial definido por el sistema.",

      steps: [
        "Ubica la venta correspondiente en la lista.",
        "Haz clic en la opción de pedir pago.",
        "Verifica la información mostrada.",
        "Seleccionar si es pago completo o mitad.",
        "Confirma la acción para generar la solicitud de pago.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1PD4jYOgr1A3xPuJUDEDtjKY4aYC99nTe/preview",

      note:
        "La solicitud de pago debe realizarse sobre una venta registrada correctamente para continuar con el proceso.",
    },

    {
      title: "Aprobar pago",
      description:
        "Este proceso permite aprobar el pago de una venta cuando se ha verificado correctamente la información correspondiente.",

      steps: [
        "Ubica la venta con pago pendiente.",
        "Haz clic en la opción de gestionar pago.",
        "Revisa el comprobante de pago que montó el cliente.",
        "Confirma la acción para aprobar el pago.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1f3RUPn8ck5IOyI9PwIf51MJp9sc32_jN/preview",

      note:
        "La aprobación del pago actualiza el estado de la venta dentro del sistema.",
    },

    {
      title: "Anular venta",
      description:
        "Este proceso permite cambiar el estado de una venta a anulada cuando sea necesario cancelar el proceso.",

      steps: [
        "Ubica la venta que deseas anular.",
        "Haz clic en la opción de anular.",
        "Justifica el motivo de la anulación.",
        "Confirma la acción en la alerta correspondiente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1mRI_F9QAdKzlTH7qegJn1-WNX6HEwrDZ/preview",

      note:
        "Se recomienda verificar el estado de la venta antes de anularla para evitar inconsistencias en el proceso comercial.",
    },
  ],
},

{
  id: "clientes",
  name: "Clientes",
  description:
    "Este módulo permite administrar la información de los clientes del sistema, facilitando su registro, consulta, actualización y eliminación según las necesidades de la plataforma.",

  tutorials: [
    {
      title: "Crear cliente",
      description:
        "Este proceso permite registrar un nuevo cliente en el sistema, ingresando su información para su posterior uso en los procesos comerciales.",

      steps: [
        "Haz clic en el botón Crear Cliente.",
        "Completa los campos obligatorios del formulario.",
        "Ingresa la información requerida del cliente.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear el cliente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1I_EaKQbwVabgIOjorBjIGBjLho-_G6H8/preview",

      note:
        "El sistema impide guardar el cliente si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar cliente",
      description:
        "Este proceso permite localizar un cliente específico dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Clientes.",
        "Ubica el campo de búsqueda.",
        "Ingresa el nombre o dato del cliente que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1tSDR5gbzCnoPQocDZLXfJpJ2D1007CGc/preview",
    },

    {
      title: "Editar cliente",
      description:
        "Este proceso permite modificar la información de un cliente registrado para mantener sus datos actualizados dentro del sistema.",

      steps: [
        "Ubica el cliente que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar el cliente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1fxkcQ5g0ndJLDYO3fcvQxy_MtlHUE78B/preview",

      note:
        "Los cambios realizados en el cliente se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de cliente",
      description:
        "Este proceso permite visualizar la información detallada de un cliente registrado en el sistema.",

      steps: [
        "Ubica el cliente en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados del cliente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/14WwVX2iwDefebq4agsxa-0v4SFL8yMnp/preview",
    },

    {
      title: "Eliminar cliente",
      description:
        "Este proceso permite eliminar un cliente del sistema cuando ya no es necesario.",

      steps: [
        "Ubica el cliente que deseas eliminar.",
        "Haz clic en el botón de eliminar.",
        "Confirma la acción en la alerta mostrada.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1k6zuAAMTj90LhLy6OSIiTc8whDn9z3F9/preview",

      note:
        "Se recomienda verificar que el cliente no tenga procesos activos asociados antes de eliminarlo para evitar inconsistencias en el sistema.",
    },
  ],
},

{
  id: "solicitudes_servicio",
  name: "Solicitudes de servicio",
  description:
    "Este módulo permite gestionar las solicitudes de servicio registradas en el sistema, facilitando su creación, consulta, actualización, impresión y cancelación según el estado del proceso.",

  tutorials: [
    {
      title: "Crear solicitud de servicio",
      description:
        "Este proceso permite registrar una nueva solicitud de servicio, ingresando la información necesaria para su gestión dentro del sistema.",

      steps: [
        "Haz clic en el botón Crear Solicitud.",
        "Completa los campos obligatorios del formulario.",
        "Ingresa la información requerida del servicio solicitado.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para registrar la solicitud.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1qdE716wcR6yieCQ38F7zgnRH3Yf1wIHF/preview",

      note:
        "El sistema impide guardar la solicitud si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar solicitud de servicio",
      description:
        "Este proceso permite localizar una solicitud específica dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Solicitudes de servicio.",
        "Ubica el campo de búsqueda.",
        "Ingresa el número o dato de la solicitud que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1kuCH8ME6u7YkjwUk9P8cS0khkAY9rSyd/preview",
    },

    {
      title: "Editar solicitud de servicio",
      description:
        "Este proceso permite modificar la información de una solicitud registrada para mantener sus datos actualizados.",

      steps: [
        "Ubica la solicitud que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar la solicitud.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1pH4xpsYd_0z_mz3-lKdxevM0DxpzDAyD/preview",

      note:
        "Los cambios realizados se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de solicitud",
      description:
        "Este proceso permite visualizar la información detallada de una solicitud de servicio registrada en el sistema.",

      steps: [
        "Ubica la solicitud en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados de la solicitud.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1mKLnHVgxXd16t8Si4TUYraA78j6h2snp/preview",
    },

    {
      title: "Imprimir solicitud de servicio",
      description:
        "Este proceso permite generar una versión imprimible de la solicitud de servicio para su uso físico o almacenamiento.",

      steps: [
        "Ubica la solicitud que deseas imprimir.",
        "Haz clic en la opción de imprimir.",
        "Verifica la vista previa del documento.",
        "Confirma la impresión o guarda el archivo según sea necesario.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1DxILiuTi9csKGWOhTTP4fkcSB-gkQpvm/preview",
    },

    {
      title: "Cancelar solicitud de servicio",
      description:
        "Este proceso permite cambiar el estado de una solicitud a cancelada cuando ya no se requiere el servicio.",

      steps: [
        "Ubica la solicitud que deseas cancelar.",
        "Haz clic en la opción de cancelar.",
        "Revisa la información mostrada.",
        "Confirma la acción en la alerta correspondiente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1d1zkMSR6SP7swXmamH-tcEhmXT7P2Wne/preview",

      note:
        "Se recomienda verificar el estado de la solicitud antes de cancelarla para evitar inconsistencias en el proceso.",
    },
  ],
},

{
  id: "ordenes_servicio",
  name: "Órdenes de servicio",
  description:
    "Este módulo permite gestionar las órdenes de servicio del sistema, facilitando su creación, consulta, actualización, impresión, seguimiento mediante historial y control de estados como garantía o cancelación.",

  tutorials: [
    {
      title: "Crear orden de servicio",
      description:
        "Este proceso permite registrar una nueva orden de servicio a partir de una solicitud o directamente desde el sistema.",

      steps: [
        "Haz clic en el botón Crear Orden de Servicio.",
        "Completa los campos obligatorios del formulario.",
        "Asocia la información del cliente y del servicio.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear la orden.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1hjEU_gitkgh6r4b66W2EqmVn0ZkJpklI/preview",

      note:
        "El sistema impide guardar la orden si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar orden de servicio",
      description:
        "Este proceso permite localizar una orden de servicio específica dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Órdenes de servicio.",
        "Ubica el campo de búsqueda.",
        "Ingresa el número o dato de la orden que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1bwOxVbLbUWkXAoTTKBFgwxVoJzq46qPE/preview",
    },

    {
      title: "Editar orden de servicio",
      description:
        "Este proceso permite modificar la información de una orden de servicio registrada para mantener sus datos actualizados.",

      steps: [
        "Ubica la orden que deseas modificar en la lista.",
        "Haz clic en el botón de editar.",
        "Actualiza la información necesaria.",
        "Verifica los cambios realizados.",
        "Haz clic en Guardar para actualizar la orden.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1KSjhi7dm31sL5vFB3z53u0SfDAQ6DAO-/preview",

      note:
        "Los cambios realizados se aplican inmediatamente una vez se guarda la información.",
    },

    {
      title: "Ver detalle de orden",
      description:
        "Este proceso permite visualizar la información detallada de una orden de servicio registrada en el sistema.",

      steps: [
        "Ubica la orden en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos asociados a la orden.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/12fY5kGJ9cx8VF7LtrvC0h85Nk0JF-xwY/preview",
    },

    {
      title: "Imprimir orden de servicio",
      description:
        "Este proceso permite generar una versión imprimible de la orden de servicio para su uso físico o almacenamiento.",

      steps: [
        "Ubica la orden que deseas imprimir.",
        "Haz clic en la opción de imprimir.",
        "Verifica la vista previa del documento.",
        "Confirma la impresión o guarda el archivo.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1mSU9wiR1_wQcNK0FzwVaVaeo3zd5DUDh/preview",
    },

    {
      title: "Agregar historial a la orden",
      description:
        "Este proceso permite registrar actualizaciones o eventos relacionados con la orden de servicio para llevar un seguimiento detallado.",

      steps: [
        "Ubica la orden en la lista.",
        "Accede a la opción de agregar historial.",
        "Ingresa la información correspondiente al evento.",
        "Guarda los cambios realizados.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1irdiCx-a1BqDBJeXwU1Xfs9rSYcrU98A/preview",

      note:
        "El historial permite llevar un seguimiento detallado del proceso de la orden de servicio.",
    },

    {
      title: "Marcar orden como garantía",
      description:
        "Este proceso permite indicar que una orden de servicio corresponde a un caso de garantía dentro del sistema.",

      steps: [
        "Ubica la orden correspondiente.",
        "Selecciona la opción de marcar como garantía.",
        "Verifica la información mostrada.",
        "Confirma la acción.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/156wE47s4TXC_m2EsJ38HQRHyEGQ2h5Dn/preview",

      note:
        "Marcar una orden como garantía puede afectar su gestión y condiciones dentro del sistema.",
    },

    {
      title: "Cancelar orden de servicio",
      description:
        "Este proceso permite cambiar el estado de una orden a cancelada cuando el servicio ya no será ejecutado.",

      steps: [
        "Ubica la orden que deseas cancelar.",
        "Haz clic en la opción de cancelar.",
        "Revisa la información mostrada.",
        "Confirma la acción en la alerta correspondiente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/15QtUVjg8k9kmGxjocxrmv2BQUx4SusD_/preview",

      note:
        "Se recomienda verificar el estado de la orden antes de cancelarla para evitar inconsistencias en el proceso.",
    },
  ],
},

{
  id: "citas",
  name: "Citas",
  description:
    "Este módulo permite visualizar y gestionar las citas del sistema a través de un calendario, facilitando su consulta, filtrado, interpretación por estado y finalización.",

  tutorials: [
    {
      title: "Listar citas en el calendario",
      description:
        "Este proceso permite visualizar de forma general las citas registradas en el sistema mediante un calendario, facilitando su consulta de manera más clara y organizada.",

      steps: [
        "Accede al módulo de Citas.",
        "Observa las citas registradas en el calendario.",
        "Ubica la fecha correspondiente a la cita que deseas consultar.",
        "Revisa la información mostrada en la vista del calendario.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1GFKbQhiXpreHwSOi5F_HgrTWWGDxyd0r/preview",
    },

    {
      title: "Filtrar citas",
      description:
        "Este proceso permite aplicar filtros para visualizar únicamente las citas que cumplan con los criterios seleccionados.",

      steps: [
        "Accede al módulo de Citas.",
        "Ubica las opciones de filtrado disponibles.",
        "Selecciona el criterio que deseas aplicar.",
        "Revisa las citas mostradas en el calendario según el filtro seleccionado.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/10R7mL60x_WB7R1MMdZ0S0ctsQ9bHFe9q/preview",

      note:
        "Los filtros permiten organizar la visualización de las citas para facilitar su consulta dentro del calendario.",
    },

    {
      title: "Interpretar la leyenda del calendario",
      description:
        "Este proceso permite identificar el significado de los colores, estados o convenciones visuales utilizadas en el calendario de citas.",

      steps: [
        "Accede al módulo de Citas.",
        "Ubica la leyenda mostrada en la interfaz.",
        "Revisa el significado de cada color o estado.",
        "Relaciona la leyenda con las citas mostradas en el calendario.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1GFKbQhiXpreHwSOi5F_HgrTWWGDxyd0r/preview",

      note:
        "La leyenda facilita la interpretación rápida del estado de cada cita dentro del calendario.",
    },

    {
      title: "Finalizar cita",
      description:
        "Este proceso permite marcar una cita como finalizada una vez se ha completado la atención o gestión correspondiente.",

      steps: [
        "Ubica la cita correspondiente en el calendario.",
        "Selecciona la opción para finalizar la cita.",
        "Revisa la información mostrada.",
        "Confirma la acción para actualizar el estado de la cita.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1x7rCpf1fdslh_kLT1UzVuHj5yeNlyD_V/preview",

      note:
        "Finalizar una cita actualiza su estado dentro del sistema y permite un mejor control del proceso.",
    },
  ],
},

{
  id: "cotizaciones",
  name: "Cotizaciones",
  description:
    "Este módulo permite gestionar las cotizaciones del sistema, facilitando su creación, consulta, revisión detallada, aprobación y cancelación según el estado del proceso.",

  tutorials: [
    {
      title: "Crear cotización",
      description:
        "Este proceso permite registrar una nueva cotización en el sistema, ingresando la información necesaria para su posterior gestión.",

      steps: [
        "Haz clic en el botón Crear Cotización.",
        "Completa los campos obligatorios del formulario.",
        "Ingresa la información requerida de la cotización.",
        "Verifica los datos registrados.",
        "Haz clic en Guardar para crear la cotización.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1_QdZ86SHCkooCBrBUAc0VuTQF7WZ1aB7/preview",

      note:
        "El sistema impide guardar la cotización si los campos obligatorios no han sido completados correctamente.",
    },

    {
      title: "Buscar cotización",
      description:
        "Este proceso permite localizar una cotización específica dentro de la lista utilizando el buscador del sistema.",

      steps: [
        "Accede al módulo de Cotizaciones.",
        "Ubica el campo de búsqueda.",
        "Ingresa el número o dato de la cotización que deseas encontrar.",
        "Revisa los resultados mostrados en la tabla.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1Z1irt4r-rM1muOAKRQfTxnhg-7B1z_cr/preview",
    },

    {
      title: "Ver detalle de cotización",
      description:
        "Este proceso permite visualizar la información detallada de una cotización registrada en el sistema.",

      steps: [
        "Ubica la cotización en la lista.",
        "Haz clic en el botón de ver detalle.",
        "Revisa la información general mostrada.",
        "Consulta los datos registrados de la cotización.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/11qOH6A6Dk_3NNHyE18IiG5LXNBrCnT_N/preview",
    },

    {
      title: "Aprobar cotización",
      description:
        "Este proceso permite cambiar el estado de una cotización a aprobada cuando ha sido revisada y aceptada.",

      steps: [
        "Ubica la cotización que deseas aprobar.",
        "Haz clic en la opción de aprobar.",
        "Revisa la información mostrada.",
        "Confirma la acción para aprobar la cotización.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1U_n0cGyx0THsUhh-wTe9LRYSDa_V7ThE/preview",

      note:
        "La aprobación actualiza el estado de la cotización dentro del sistema y permite continuar con el proceso correspondiente.",
    },

    {
      title: "Cancelar cotización",
      description:
        "Este proceso permite cambiar el estado de una cotización a cancelada cuando ya no continuará dentro del proceso.",

      steps: [
        "Ubica la cotización que deseas cancelar.",
        "Haz clic en la opción de cancelar.",
        "Revisa la información mostrada.",
        "Confirma la acción en la alerta correspondiente.",
      ],

      videoUrl:
        "https://drive.google.com/file/d/1qoqlJn0nLcioNet9AlfF5DExg_fXX9fL/preview",

      note:
        "Se recomienda verificar el estado de la cotización antes de cancelarla para evitar inconsistencias en el proceso.",
    },
  ],
},

];