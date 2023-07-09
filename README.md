# Migrations

- Update schema on ./src/datasources/db/schema.ts
- run `npx generate` to create the migraiton files
- check they are working
- run `npx migrate` to run the migrations agains the environment variables in `.dev.vars` file

# Requirements

- Have `.dev.vars` file with the following content

```txt
DATABASE_URL="STRING FROM NEONDB"
```
