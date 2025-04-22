import { Hono } from 'hono';

import { drizzle } from 'drizzle-orm/node-postgres';
import { tasks, categories } from '../drizzle/schema';
import { eq, desc, not } from 'drizzle-orm';

const db = drizzle(process.env.DB_URL!);

interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
  categoryName: string | null;
}

interface Category {
  id: number;
  name: string;
}

const app = new Hono();

/**
 * Fetches a list of tasks from the database.
 *
 * This function retrieves all tasks from the `tasks` table, along with their associated
 * category names (if any) by performing a left join with the `categories` table.
 * The results are ordered by the `createdAt` field in descending order.
 *
 * @returns {Promise<Task[]>} A promise that resolves to an array of `Task` objects.
 * If an error occurs during the database query, an empty array is returned.
 *
 * @throws Logs an error message to the console if the database query fails.
 */
async function fetchTasks(): Promise<Task[]> {
  try {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        done: tasks.done,
        createdAt: tasks.createdAt,
        categoryName: categories.name,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .orderBy(desc(tasks.createdAt));

    return result as Task[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

/**
 * Fetches a list of categories from the database.
 *
 * This function retrieves all categories from the `categories` table,
 * selecting their `id` and `name` fields. The results are ordered
 * alphabetically by the `name` field.
 *
 * @returns {Promise<Category[]>} A promise that resolves to an array of `Category` objects.
 * If an error occurs during the database query, an empty array is returned.
 *
 * @throws Logs an error message to the console if the database query fails.
 */
async function fetchCategories(): Promise<Category[]> {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .orderBy(categories.name);

    return result as Category[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Generates a table row for a task.
 *
 * @param {Task} task - The task to render.
 * @returns {string} The HTML string for the task row.
 */
function renderTaskRow(task: Task): string {
  return `
    <tr>
      <td style="padding: 8px;">${task.id}</td>
      <td style="padding: 8px;">${task.title}</td>
      <td style="padding: 8px;">
        <form action="/tasks/${task.id}/toggle" method="POST" style="margin: 0;">
          <input
            type="checkbox"
            ${task.done ? 'checked' : ''}
            onchange="this.form.submit()"
          >
        </form>
      </td>
      <td style="padding: 8px;">${task.categoryName || '-'}</td>
      <td style="padding: 8px;">${new Date(task.createdAt).toLocaleString()}</td>
      <td style="padding: 8px;">
        <form action="/tasks/${task.id}/delete" method="POST" style="margin: 0;">
          <button type="submit" onclick="return confirm('Are you sure you want to delete this task?')">Delete</button>
        </form>
      </td>
    </tr>
  `;
}

/**
 * Generates a table row for a category.
 *
 * @param {Category} category - The category to render.
 * @returns {string} The HTML string for the category row.
 */
function renderCategoryRow(category: Category): string {
  return `
    <tr>
      <td style="padding: 8px;">${category.id}</td>
      <td style="padding: 8px;">${category.name}</td>
      <td style="padding: 8px;">
        <form action="/categories/${category.id}/delete" method="POST" style="margin: 0;">
          <button type="submit" onclick="return confirm('Are you sure? This will also remove the category from all tasks.')">Delete</button>
        </form>
      </td>
    </tr>
  `;
}

/**
 * Generates the HTML for a dropdown of categories.
 *
 * @param {Category[]} categories - The list of categories.
 * @returns {string} The HTML string for the dropdown options.
 */
function renderCategoryOptions(categories: Category[]): string {
  return categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join('');
}

/**
 * Generates the HTML for the categories table.
 *
 * @param {Category[]} categories - The list of categories to display.
 * @returns {string} The HTML string for the categories section.
 */
function renderCategoriesTable(categories: Category[]): string {
  const rows =
    categories.length === 0
      ? '<tr><td colspan="3" style="padding: 8px; text-align: center;">No categories found</td></tr>'
      : categories.map(renderCategoryRow).join('');

  return `
    <div class="categories-table">
      <h2>Categories</h2>
      <form action="/categories" method="POST" style="margin: 20px 0;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            type="text"
            name="name"
            placeholder="Category name"
            required
            style="padding: 4px 8px;"
          >
          <button type="submit">Add Category</button>
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
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generates the HTML for the tasks table.
 *
 * @param {Task[]} tasks - The list of tasks to display.
 * @param {Category[]} categories - The list of categories for the task form dropdown.
 * @returns {string} The HTML string for the tasks section.
 */
function renderTasksTable(tasks: Task[], categories: Category[]): string {
  const rows =
    tasks.length === 0
      ? '<tr><td colspan="6" style="padding: 8px; text-align: center;">No tasks found</td></tr>'
      : tasks.map(renderTaskRow).join('');

  const categoryOptions = renderCategoryOptions(categories);

  return `
    <div class="tasks-table">
      <h2>Tasks</h2>
      <form action="/tasks" method="POST" style="margin: 20px 0;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            type="text"
            name="title"
            placeholder="Task title"
            required
            style="padding: 4px 8px;"
          >
          <select name="category_id" required style="padding: 4px 8px;">
            <option value="">Select a category</option>
            ${categoryOptions}
          </select>
          <button type="submit">Add Task</button>
        </div>
      </form>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px;">ID</th>
            <th style="padding: 8px;">Title</th>
            <th style="padding: 8px;">Status</th>
            <th style="padding: 8px;">Category</th>
            <th style="padding: 8px;">Created At</th>
            <th style="padding: 8px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Home route: Displays tasks and categories with forms for adding new ones
app.get('/', async (c) => {
  const [tasks, categories] = await Promise.all([fetchTasks(), fetchCategories()]);

  const categoriesHTML = renderCategoriesTable(categories);
  const tasksHTML = renderTasksTable(tasks, categories);

  return c.html(`
    <div style="display: flex; gap: 40px;">
      ${categoriesHTML}
      ${tasksHTML}
    </div>
  `);
});

/**
 * Handles the creation of a new category.
 *
 * This route processes form data submitted via POST to create a new category
 * in the database. If the `name` field is missing or invalid, a 400 error is returned.
 *
 * @param {Context} c - The Hono context object.
 * @returns {Response} A redirect to the home page or an error message.
 */
app.post('/categories', async (c) => {
  try {
    const formData = await c.req.formData();
    const name = formData.get('name');

    if (!name || typeof name !== 'string') {
      return c.text('Category name is required', 400);
    }

    await db.insert(categories).values({ name });

    return c.redirect('/');
  } catch (error: any) {
    console.log('Error:', error.message);
    return c.text('Error creating category: ' + error.message, 500);
  }
});

/**
 * Handles the creation of a new task.
 *
 * This route processes form data submitted via POST to create a new task
 * in the database. If the `title` or `category_id` fields are missing or invalid,
 * a 400 error is returned.
 *
 * @param {Context} c - The Hono context object.
 * @returns {Response} A redirect to the home page or an error message.
 */
app.post('/tasks', async (c) => {
  try {
    const formData = await c.req.formData();
    const title = formData.get('title');
    const categoryId = formData.get('category_id');

    if (!title || typeof title !== 'string') {
      return c.text('Task title is required', 400);
    }

    if (!categoryId || typeof categoryId !== 'string' || categoryId === '') {
      return c.text('Category selection is required', 400);
    }

    await db.insert(tasks).values({
      title: title,
      categoryId: parseInt(categoryId, 10),
    });

    return c.redirect('/');
  } catch (error: any) {
    console.log('Error:', error.message);
    return c.text('Error creating task: ' + error.message, 500);
  }
});

/**
 * Toggles the completion status of a task.
 *
 * This route updates the `done` field of a task in the database, flipping its value.
 *
 * @param {Context} c - The Hono context object.
 * @returns {Response} A redirect to the home page or an error message.
 */
app.post('/tasks/:id/toggle', async (c) => {
  try {
    const taskId = c.req.param('id');

    await db
      .update(tasks)
      .set({ done: not(tasks.done) })
      .where(eq(tasks.id, parseInt(taskId, 10)));

    return c.redirect('/');
  } catch (error: any) {
    console.log('Error:', error.message);
    return c.text('Error toggling task status: ' + error.message, 500);
  }
});

/**
 * Deletes a task from the database.
 *
 * This route removes a task identified by its ID from the `tasks` table.
 *
 * @param {Context} c - The Hono context object.
 * @returns {Response} A redirect to the home page or an error message.
 */
app.post('/tasks/:id/delete', async (c) => {
  try {
    const taskId = c.req.param('id');

    await db.delete(tasks).where(eq(tasks.id, parseInt(taskId, 10)));

    return c.redirect('/');
  } catch (error: any) {
    console.log('Error:', error.message);
    return c.text('Error deleting task: ' + error.message, 500);
  }
});

/**
 * Deletes a category from the database.
 *
 * This route removes a category identified by its ID from the `categories` table.
 *
 * @param {Context} c - The Hono context object.
 * @returns {Response} A redirect to the home page or an error message.
 */
app.post('/categories/:id/delete', async (c) => {
  try {
    const categoryId = c.req.param('id');

    await db.delete(categories).where(eq(categories.id, parseInt(categoryId, 10)));

    return c.redirect('/');
  } catch (error: any) {
    console.log('Error:', error.message);
    return c.text('Error deleting category: ' + error.message, 500);
  }
});

export default app;
