import { Hono } from "hono";
import { sql } from "bun";

const app = new Hono();

// Define interfaces for the database
interface Task {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
  category_name: string | null;
}

interface Category {
  id: number;
  name: string;
}

// Helper function to fetch the tasks
async function fetchTasks(): Promise<Task[]> {
  try {
    const tasks = await sql`
      SELECT 
        t.id,
        t.title,
        t.done,
        t.created_at,
        c.name as category_name
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.created_at DESC
    `;
    return tasks as Task[];
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

// Helper function to fetch categories
async function fetchCategories(): Promise<Category[]> {
  try {
    const categories = await sql`
      SELECT 
        id,
        name
      FROM categories
      ORDER BY name ASC
    `;
    return categories as Category[];
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Helper function to check if tables exists
async function checkTablesExist() {
  try {
    const result = await sql`
      SELECT (
        EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'categories'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'tasks'
        )
      ) AS tables_exist;
    `;

    return result[0].tables_exist;
  } catch (error: any) {
    console.error("Error checking tables: " + error.message);
    return false;
  }
}

// HTML template functions
/**
 * Renders HTML controls for managing database tables based on their existence.
 *
 * @param tablesExist - A boolean indicating whether the tables already exist.
 *   - If `true`, the function returns HTML with a message indicating the tables exist
 *     and a form to delete the tables.
 *   - If `false`, the function returns HTML with a form to create the tables.
 * @returns A string containing the HTML for the appropriate table management controls.
 */
function renderTableControls(tablesExist: boolean): string {
  if (!tablesExist) {
    return `
        <form action="/create-tables" method="POST">
          <button type="submit">Create tables</button>
        </form>
      `;
  }

  return `
      <p>Tables exist!</p>
      <form action="/delete-tables" method="POST">
        <button type="submit">Delete tables</button>
      </form>
    `;
}

/**
 * Renders a HTML table of categories.
 *
 * This function takes an array of Category objects and generates an HTML string
 * containing a styled table with the categories' data. If the array is empty,
 * a message indicating no categories were found is displayed instead.
 *
 * @param categories - An array of Category objects to display in the table
 * @returns An HTML string representing the categories table
 *
 * @example
 * ```typescript
 * const categories = [
 *   { id: 1, name: 'Books' },
 *   { id: 2, name: 'Electronics' }
 * ];
 * const htmlTable = renderCategoriesTable(categories);
 * ```
 */
function renderCategoriesTable(categories: Category[]): string {
  return `
      <div class="categories-table">
        <h2>Categories</h2>
        
        <form action="/categories" method="POST" style="margin: 20px 0;">
            <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" name="name" />
            <button type="submit">Add category</button>
          </div>
        </form>


        <table border="1" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px;">ID</th>
              <th style="padding: 8px;">Name</th>
              <th style="padding: 8px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              categories.length === 0
                ? '<tr><td colspan="3" style="padding: 8px; text-align: center">No categories found.</td></tr>'
                : categories
                    .map(
                      (category) => `
            <tr>
              <td style="padding: 8px;">${category.id}</td>
              <td style="padding: 8px;">${category.name}</td>
              <td style="padding: 8px;">
                <form action="/categories/${category.id}/delete" method="POST" style="margin: 0;">
                  <button type="submit">Delete</button>
                </form>
              </td>
            </tr>`
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    `;
}

function rendeTasksTable(tasks: Task[], categories: Category[]): string {
  return `
      <div class="tasks-table">
        <h2>Tasks</h2>
        
        <form action="/tasks" method="POST">
          <div>
            <input type="text" name="title" />
            <select id="options" name="category_id" required >
              <option value="">Select a category</option>
              ${categories
                .map(
                  (category) =>
                    `<option value="${category.id}">${category.name}</option>`
                )
                .join("")}
            </select>
            <button type="submit">Add task</button>
          </div>
        </form>


        <table border="1" style="border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px;">ID</th>
              <th style="padding: 8px;">Title</th>
              <th style="padding: 8px;">Status</th>
              <th style="padding: 8px;">Category</th>
              <th style="padding: 8px;">Created At</th>
              <th style="padding: 8px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${
              tasks.length === 0
                ? '<tr><td colspan="6" style="padding: 8px; text-align: center">No tasks found.</td></tr>'
                : tasks
                    .map(
                      (task) => `
                        <tr>
                          <td style="padding: 8px;">
                            ${task.id}
                          </td>
                          <td style="padding: 8px;">${task.title}</td>
                          <td style="padding: 8px;">
                          <form action="/tasks/${task.id}/toggle" method="POST">
                            <button type="submit" name="done" style="border: none; background: none; cursor: pointer;" >
                              ${task.done ? "✅" : "❌"}
                            </button>  
                          </form>  
                         
                          </td>
                          <td style="padding: 8px;">${task.category_name}</td>
                          <td style="padding: 8px;">${new Date(
                            task.created_at
                          ).toLocaleString()}</td>

                          <td style="padding: 8px;">
                            <form action="/tasks/${
                              task.id
                            }/delete" method="POST" style="margin: 0;">
                              <button type="submit" onclick="return confirm('Are you sure you want to delete?')">Delete</button>
                            </form>
                        </td>
                        </tr>
                `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>
    `;
}

// Then update the route handler
app.get("/", async (c) => {
  const tablesExist = await checkTablesExist();

  if (!tablesExist) {
    return c.html(`<div> ${renderTableControls(tablesExist)}</div>`);
  }

  const [tasks, categories] = await Promise.all([
    fetchTasks(),
    fetchCategories(),
  ]);

  const htmlContent = `
      <div>
        ${renderTableControls(tablesExist)}
        <div style="display: flex; gap: 40px;">
          ${renderCategoriesTable(categories)}
          ${rendeTasksTable(tasks, categories)}
        </div>
      </div>
    `;

  return c.html(htmlContent);
});

// Route to create tables
app.post("/create-tables", async (c) => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
      )
    `;

    return c.redirect("/");
  } catch (error: any) {
    return c.text("Error creating tables: " + error.message, 500);
  }
});

app.post("/delete-tables", async (c) => {
  try {
    await sql`DROP TABLE IF EXISTS tasks;`;
    await sql`DROP TABLE IF EXISTS categories;`;
    return c.redirect("/");
  } catch (error: any) {
    return c.text("Error deleting tables: " + error.message, 500);
  }
});

app.post("/categories", async (c) => {
  try {
    const formData = await c.req.formData();
    const name = formData.get("name");

    if (!name || typeof name !== "string") {
      return c.text("Category name is required", 400);
    }

    await sql`
      INSERT INTO categories (name) VALUES (${name})
    `;
    return c.redirect("/");
  } catch (error: any) {
    console.error("Error:", error.message);
    return c.text("Error:" + error.message, 500);
  }
});

app.post("/categories/:id/delete", async (c) => {
  try {
    const id = c.req.param("id");

    await sql`
      DELETE FROM categories 
      WHERE id = ${id}
    `;
    return c.redirect("/");
  } catch (error: any) {
    console.error("Error:", error.message);
    return c.text("Error:" + error.message, 500);
  }
});

app.post("/tasks", async (c) => {
  try {
    const formData = await c.req.formData();
    const title = formData.get("title");
    const category_id = formData.get("category_id");

    if (!title || typeof title !== "string") {
      return c.text("Task title is required", 400);
    }

    if (!category_id || typeof category_id !== "string") {
      return c.text("Category ID is required", 400);
    }

    await sql`
      INSERT INTO tasks (title, category_id) VALUES (${title}, ${category_id})
    `;
    return c.redirect("/");
  } catch (error: any) {
    console.error("Error:", error.message);
    return c.text("Error:" + error.message, 500);
  }
});

app.post("/tasks/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");

    await sql`
      UPDATE tasks 
      SET done = NOT done 
      WHERE id = ${id}
    `;
    return c.redirect("/");
  } catch (error: any) {
    console.error("Error:", error.message);
    return c.text("Error:" + error.message, 500);
  }
});

app.post("/tasks/:id/delete", async (c) => {
  try {
    const id = c.req.param("id");

    await sql`
      DELETE FROM tasks 
      WHERE id = ${id}
    `;
    return c.redirect("/");
  } catch (error: any) {
    console.error("Error:", error.message);
    return c.text("Error:" + error.message, 500);
  }
});

export default app;
