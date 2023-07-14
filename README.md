# Migraciones

- Actualiza el esquema en `./src/datasources/db/schema.ts`
- Ejecuta `npx db:generate` para crear los archivos de migración
- Verifica que estén funcionando
- Ejecuta `npx db:migrate` para ejecutar las migraciones utilizando las variables de entorno en el archivo `.dev.vars`
- Ejecuta `npx db:push` para ejecutar las migraciones utilizando las variables de entorno en el archivo `.dev.vars`

# Requisitos

- Tener un archivo `.dev.vars` con el siguiente contenido

```txt
DATABASE_URL="PREGUNTALE AL EQUIPO POR ESTO"
DATABASE_TOKEN="PREGUNTALE AL EQUIPO POR ESTO"
```

# Correr el projecto

- Asegurate de tener el archivo .dev.vars
- `npm i`
- `num run dev`
- 🎉

# TESTS

## Nuestro Setup

- Database isolation
- Graphql mocking
- Fixtures

## Como correr tests

- `npm run test`

## Como crear tests

- Como creo cosas en BDD?
- Como testeo graphql?
- Como reseteo la BDD entre tests?

# Architectura

- Cloudflare workers - DB

# STACK

- turso / npm / graphql-yoga / zod / drizzle / cloudflare workers
