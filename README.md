# Task Management Application

A modern task management application built with Hono, Bun, PostgreSQL, and Drizzle ORM. This application allows users to create, manage, and organize tasks with categories.

## Features

- Create and manage tasks with titles and completion status
- Organize tasks by categories
- Mark tasks as complete/incomplete
- Delete tasks and categories
- Clean, responsive interface

## Technology Stack

- **[Hono](https://hono.dev/)**: Lightweight web framework
- **[Bun](https://bun.sh/)**: JavaScript runtime and package manager
- **[PostgreSQL](https://www.postgresql.org/)**: Database for storing tasks and categories
- **[Drizzle ORM](https://orm.drizzle.team/)**: Type-safe SQL query builder
- **[Preact](https://preactjs.com/)**: Lightweight alternative to React for UI rendering

## Setup

### Prerequisites

- Bun installed (run `curl -fsSL https://bun.sh/install | bash` if not installed)
- PostgreSQL database
- Node.js 16+

### Installation

1. Clone the repository
2. Install dependencies:

```sh
bun install
```

3. Configure your database connection:

Create a .env file in the project root with the following content:

```
DB_URL=postgresql://postgres:@localhost:5432/hono-bun-forms-pgsql-drizzle
```

Replace the connection string with your PostgreSQL database details.

4. Set up the database schema:

```sh
bun drizzle-kit generate
bun drizzle-kit push:pg
```

## Running the Application

### Standard Version (Template Strings)

Run the application with standard HTML template string rendering:

```sh
bun run src/index.ts
```

### Development Mode

Run the application in development mode with hot reloading:

```sh
bun run --hot src/index.ts
```

### JSX/Preact Version

To run the application with JSX/Preact rendering:

```sh
bun run src/index.tsx
```

## Project Structure

- src: Application source code
  - `index.ts`: Main application entry point
  - `index.tsx`: JSX/Preact version (if you're using JSX)
- drizzle: Database schema and migrations
  - `schema.ts`: Database schema definitions
  - `migrations/`: Schema migrations

## Database Schema

The application uses two main tables:

1. `categories`: Stores task categories
   - `id`: Serial primary key
   - `name`: Category name (unique)

2. `tasks`: Stores individual tasks
   - `id`: Serial primary key
   - `title`: Task title
   - `done`: Completion status
   - `createdAt`: Creation timestamp
   - `categoryId`: Foreign key to categories

## Key Functions

- `fetchTasks()`: Retrieves all tasks with their associated categories
- `fetchCategories()`: Retrieves all available categories
- Task Creation: Add new tasks with category assignment
- Task Toggle: Mark tasks as complete/incomplete
- Delete Operations: Remove tasks or categories

## Troubleshooting

If you encounter issues:

1. Check your database connection string in the .env file
2. Ensure PostgreSQL is running and accessible
3. Verify that all dependencies are installed with `bun install`
4. Check console for error messages

## Code of Conduct and Usage Restrictions

This project adheres to an ethical code of conduct. The author does not permit use of this software for purposes that promote discrimination, hatred, harm to vulnerable populations, or undermine democratic values. By using this software, you agree to deploy it only for purposes that respect human rights, dignity, and democratic principles.

## License

This project is open source and available under the MIT License.
