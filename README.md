# questionit.api

<p align="center" style="margin-top: 2rem">
  <a href="https://questionit.space/" target="_blank"><img src="https://questionit.space/images/logo/BannerWhite.png" width="380" alt="Nest Logo" /></a>
</p>

> API service for QuestionIt.space

**This is public API of QuestionIt.space**. Please see [bootstrap](https://github.com/alkihis/questionit.bootstrap) to access all projects.

### Tech stack

- Nest.js 8
- TypeORM 0.2
- PostgreSQL 14
- twitter-api-v2 1.11
- Node 14+

### Structure

- `src`: TypeScript code root
  - `app`: Main application module
  - `bootstraps`: Files that can start the application (or a part of it)
  - `database`: Database-related files (entities, tyes, migrations)
    - `entities`: TypeORM entities
    - `enums`: Enum types related to entities
    - `interfaces`:  Interfaces related to entities
    - `migrations`: TypeORM migration files
  - `features`: Modules that provides REST-ful API (with Nest controllers). Each directory refers to a specific part of the public application API.
  - `shared`: All the things that can be imported by the main application or its services, without being directly related to a database entity
    - `config`: App config
    - `filters`: Nest filters
    - `guards`: Nest guards applicables to controllers
    - `logger`: Loggers applicables to Nest or TypeORM
    - `managers`: Worker management or request user wrapping
    - `middlewares`: Nest middlewares
    - `modules`: Global module where each of its services can be imported anywhere. Helps shared things like notifications, errors or Twitter handling to be shared across the app.
    - `pipes`: Nest validation pipes
    - `queues`: Bull-powered queues; only used to handle CRON jobs
    - `strategies`: Authentication strategies
    - `utils`: Shared utils about everything: string, regex, query parsing and more
    - `workers`: Files that should run in a dedicated `worker_thread`
  - `static`: `serve-static` configuration
  - `v1-migration`: Bunch of scripts able to convert beta v1 QuestionIt.space data to current application
- `data`: JSON-files meant to store basic data
- `uploads`: Structure for POST file upload and file processing

## Run

See bootstrap to learn how service can be started in dev mode.

## Endpoint documentation

For endpoint documentation, see API docs.
