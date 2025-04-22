/** @jsxImportSource preact */
import { Hono } from 'hono';
import { render } from 'preact-render-to-string';
/** @jsx h */
import { h } from 'preact';
import { drizzle } from 'drizzle-orm/node-postgres';
import { tasks, categories } from '../drizzle/schema';
import { eq, desc, not } from 'drizzle-orm';

// Define interfaces for better type safety
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

const db = drizzle(process.env.DB_URL!);
const app = new Hono();

// Data fetching functions
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

// JSX Components
import { VNode } from 'preact';

const Layout = ({ children }: { children: VNode<any> }) => (
  <html>
    <head>
      <title>Task Manager</title>
    </head>
    <body>
      <div style="display: flex; gap: 40px;">{children}</div>
    </body>
  </html>
);

const Categories = ({ categories }: { categories: any[] }) => (
  <div class="categories-table">
    <h2>Categories</h2>
    <form action="/categories" method="post" style="margin: 20px 0;">
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" name="name" placeholder="Category name" required style="padding: 4px 8px;" />
        <button type="submit">Add Category</button>
      </div>
    </form>
    <table style="border-collapse: collapse; border: 1px solid black;">
      <thead>
        <tr>
          <th style="padding: 8px;">ID</th>
          <th style="padding: 8px;">Name</th>
          <th style="padding: 8px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {categories.length === 0 ? (
          <tr>
            <td colspan={3} style="padding: 8px; text-align: center;">
              No categories found
            </td>
          </tr>
        ) : (
          categories.map((category) => (
            <tr>
              <td style="padding: 8px;">{category.id}</td>
              <td style="padding: 8px;">{category.name}</td>
              <td style="padding: 8px;">
                <form action={`/categories/${category.id}/delete`} method="post" style="margin: 0;">
                  <button
                    type="submit"
                    onClick={() => confirm('Are you sure? This will also remove the category from all tasks.')}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const Tasks = ({ tasks, categories }: { tasks: any[]; categories: any[] }) => (
  <div class="tasks-table">
    <h2>Tasks</h2>
    <form action="/tasks" method="post" style="margin: 20px 0;">
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" name="title" placeholder="Task title" required style="padding: 4px 8px;" />
        <select name="category_id" required style="padding: 4px 8px;">
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option value={category.id}>{category.name}</option>
          ))}
        </select>
        <button type="submit">Add Task</button>
      </div>
    </form>
    <table style="border-collapse: collapse; border: 1px solid black;">
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
        {tasks.length === 0 ? (
          <tr>
            <td colspan={6} style="padding: 8px; text-align: center;">
              No tasks found
            </td>
          </tr>
        ) : (
          tasks.map((task) => (
            <tr>
              <td style="padding: 8px;">{task.id}</td>
              <td style="padding: 8px;">{task.title}</td>
              <td style="padding: 8px;">
                <form action={`/tasks/${task.id}/toggle`} method="post" style="margin: 0;">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => (document.forms[0] as HTMLFormElement).submit()}
                  />
                </form>
              </td>
              <td style="padding: 8px;">{task.categoryName || '-'}</td>
              <td style="padding: 8px;">{new Date(task.createdAt).toLocaleString()}</td>
              <td style="padding: 8px;">
                <form action={`/tasks/${task.id}/delete`} method="post" style="margin: 0;">
                  <button type="submit" onClick={() => confirm('Are you sure you want to delete this task?')}>
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// Home route: Render tasks and categories using JSX
app.get('/', async (c) => {
  const [tasks, categories] = await Promise.all([fetchTasks(), fetchCategories()]);
  const html = render(
    <Layout>
      <div>
        <Categories categories={categories} />
        <Tasks tasks={tasks} categories={categories} />
      </div>
    </Layout>
  );
  return c.html(html);
});

// Add route handlers for categories
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
    console.error('Error creating category:', error);
    return c.text('Error creating category: ' + error.message, 500);
  }
});

app.post('/categories/:id/delete', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await db.delete(categories).where(eq(categories.id, id));
    return c.redirect('/');
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return c.text('Error deleting category: ' + error.message, 500);
  }
});

// Add route handlers for tasks
app.post('/tasks', async (c) => {
  try {
    const formData = await c.req.formData();
    const title = formData.get('title');
    const categoryId = formData.get('category_id');

    if (!title || typeof title !== 'string') {
      return c.text('Task title is required', 400);
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return c.text('Category selection is required', 400);
    }

    await db.insert(tasks).values({
      title,
      categoryId: parseInt(categoryId, 10),
    });
    return c.redirect('/');
  } catch (error: any) {
    console.error('Error creating task:', error);
    return c.text('Error creating task: ' + error.message, 500);
  }
});

app.post('/tasks/:id/toggle', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await db
      .update(tasks)
      .set({ done: not(tasks.done) })
      .where(eq(tasks.id, id));
    return c.redirect('/');
  } catch (error: any) {
    console.error('Error toggling task:', error);
    return c.text('Error toggling task: ' + error.message, 500);
  }
});

app.post('/tasks/:id/delete', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    await db.delete(tasks).where(eq(tasks.id, id));
    return c.redirect('/');
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return c.text('Error deleting task: ' + error.message, 500);
  }
});

export default app;
