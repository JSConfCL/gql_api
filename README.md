# Como Ejecutar el proyecto

- Asegurate de tener el archivo .dev.vars (Pídele al equipo los valores correspondientes.)
  - Puedes correr una BDD local si te parece.
  - Para correr el proyecto con las BDD de desarrollo, tienes que agregar un archivo `.dev.vars` con los valores de las mismas.
  - Preguntale al equipo por esto, o crea tu propia BDD en [turso.tech](https://turso.tech/) para obtener los valores
  - ```
    DATABASE_URL="XXXXXXXXXXXX"
    DATABASE_TOKEN="XXXXXX"
    ```
- Finalmente, `npm i` & `num run dev`

# Cómo contribuir al proyecto

- Si buscas una feature nueva, sugiérela creando un issue [acá](https://github.com/JSConfCL/gql_api/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc).
- Haz un fork del repositorio y crea una nueva rama para tu funcionalidad o corrección.
- Realiza tus cambios, y escribe pruebas que cubran el nuevo código.
- Envía una solicitud de pull.

# Cómo escribir tests

## Preparación del entorno de prueba

Antes de empezar a escribir tus tests, asegúrate de tener un entorno de prueba adecuado. Puedes necesitar borrar y recrear la base de datos antes de cada test para asegurarte de que los datos de un test no afecten a los demás. En nuestros ejemplos, usamos la función clearDatabase() en el hook afterEach() para lograr esto.

## Escribir la query o mutación

(Ejemplos [en este archivo](https://github.com/JSConfCL/gql_api/blob/56b15a02ec21bb8ed2f87b850a227680269bd370/src/tests/user.test.ts#L7))
Define la query o mutation GraphQL que quieres que tu resolver maneje.
Para esto, usa la función gql de la biblioteca graphql-tag. Por ejemplo:

```TS
import gql from "graphql-tag";
const myQuery = gql/* GraphQL */`
  query {
    myField
  }
`;
```

## Escribir el test

Usa la biblioteca de pruebas de tu elección para escribir el test. En nuestro caso, usamos vitest. Tu test debe ejecutar la consulta o mutación usando tu API GraphQL y luego verificar que la respuesta sea la esperada. Aquí hay un ejemplo:

```TS
describe("My Resolver Tests", () => {
  it("Should return the correct data", async () => {
  });
});
```

## Inserta data en tu BDD

Usa (o crea) métodos en (./src/tests/fixtures/index.ts)[src/tests/fixtures/index.ts] para pre-popular tu BDD.
Por ejemplo:

```TS
import { insertUser } from "~/tests/fixtures";
describe("My Resolver Tests", () => {
  it("Should return the correct data", async () => {
    const user = await insertUser();
    const user2 = await insertUser({ email: "email@especifico.com" });
  });
});
```

## Ejecuta tu query o mutación.

Tenemos un helper para realizar esto, llamado `executeGraphqlOperation`.
Donde puedes pasar la operación que definiste en el parametro `"document"`
Por ejemplo:

```TS
import { insertUser } from "~/tests/fixtures";
import * as gql from "graphql-tag"

const myQuery = gql/* GraphQL */`
  query {
    myField
  }
`;

describe("My Resolver Tests", () => {
  it("Should return the correct data", async () => {
    const user = await insertUser();
    const user2 = await insertUser({ email: "email@especifico.com" });
    const response = await executeGraphqlOperation({
      document: getUsersQuery,
    });
  });
});
```

## Verifica tus respuestas:

Puedes usar métodos assert o expect de [Vitest](https://vitest.dev/api/expect.html)

```TS
import { insertUser } from "~/tests/fixtures";
import * as gql from "graphql-tag"

const myQuery = gql/* GraphQL */`
  query {
    myField
  }
`;

describe("My Resolver Tests", () => {
  it("Should return the correct data", async () => {
    const user = await insertUser();
    const user2 = await insertUser({ email: "email@especifico.com" });
    const response = await executeGraphqlOperation({
      document: getUsersQuery,
    });
    assert.equal(response.data.users.length, 2)
  });
});
```

## Manejo de errores

Además de verificar que tu resolver devuelve los datos correctos, verifica cómo maneja los errores. Por ejemplo, puedes escribir un test que pase datos incorrectos a tu mutación y luego verificar que la respuesta contiene el error correcto, o que falla donde debería fallar 😀.

# Migraciones

Nuestra BDD es turso, usando `libsql` en local. Usamos `drizzle` y `drizzle-kit` para manejar conexiones a la BDD, que genera automaticamente archivos de migraciones cuando cambias tus modelos, lo que hace muchisimo más facil es escribrlas.

## Cómo escribir migraciones?

### 1. Actualiza el esquema.

Primero, necesitas actualizar el archivo del esquema en `./src/datasources/db/schema.ts`.
Este archivo define la estructura de la base de datos.
Por ejemplo, aquí es donde se definen las tablas y sus campos, así como las relaciones entre las tablas.
Para definir una tabla, utilizas la función `sqliteTable()`, donde el primer argumento es el nombre de la tabla y el segundo es un objeto que define los campos de la tabla.

Por ejemplo:

```TS
export const usersSchema = sqliteTable("users", {
  id: text("id").unique().notNull(),
  name: text("name"),
  bio: text("bio", { length: 1024 }),
  // ...
});
```

En este ejemplo, se define una tabla users con varios campos, incluyendo id, name, y bio. Los campos se definen utilizando funciones como text() e integer(), y se pueden agregar opciones adicionales, como unique(), notNull(), y default().

### 2. Genera los archivos de migración.

Una vez que hayas actualizado el esquema, debes generar los archivos de migración. Para hacerlo, ejecuta npx db:generate.

### 3. Verifica las migraciones:

Antes de ejecutar las migraciones, verifica que están funcionando correctamente.
Puedes hacer esto corriendo todos los tests. Estos geeneran una BDD desde 0, y corren todas las migraciones antes de correr los tests.

### 4. Ejecuta las migraciones:

Finalmente, ejecuta las migraciones con `npm run db:migrate`.
Estos comandos utilizan las variables de entorno definidas en el archivo .dev.vars para conectarse a las BDD de desarrollo.

# Requisitos

- Tener un archivo `.dev.vars` con el siguiente contenido

```txt
DATABASE_URL="PREGUNTALE AL EQUIPO POR ESTO"
DATABASE_TOKEN="PREGUNTALE AL EQUIPO POR ESTO"
```

## Como correr tests

- `npm run test`

# STACK

- Turso:
  Una herramienta para generar código TypeScript a partir de archivos de especificación. Es útil para crear una API de tipo fuerte y garantizar la coherencia entre los diferentes componentes de un sistema.

- GraphQL Yoga:
  Un servidor GraphQL fácil de configurar que se apoya en Express.js. Proporciona una forma sencilla de crear servidores GraphQL que se pueden conectar a cualquier fuente de datos.

- Zod:
  Una biblioteca de validación y análisis de datos para JavaScript y TypeScript. Se utiliza para definir y validar esquemas de datos.

- Drizzle:
  ORM (Object-Relational Mapping) para SQLite en TypeScript. Ayuda a interactuar con bases de datos SQLite de una manera más estructurada y segura.

- Cloudflare Workers:
  Una plataforma de servidor sin servidor que permite ejecutar código en la red de distribución de contenido (CDN) de Cloudflare, lo que permite respuestas más rápidas y menor latencia al ejecutar código cerca del usuario final​1​.
