// Browser smoke against a deployed instance: BASE_URL (default http://localhost:5450).
import { chromium } from 'playwright';

const base = (process.env.BASE_URL ?? 'http://localhost:5450').replace(/\/$/, '');
const title = `smoke ${Date.now()}`;

const health = await (await fetch(`${base}/health`)).json();
if (health.status !== 'ok') throw new Error(`unhealthy: ${JSON.stringify(health)}`);
console.log('health', health);

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(base);
  await page.getByLabel('Title').first().fill(title);
  await page.getByRole('button', { name: 'Add note' }).click();
  await page.getByText(title).waitFor();

  await page.getByRole('checkbox', { name: `Mark "${title}" as done` }).click();
  // the label flips to "as open" once the API confirmed the toggle
  const done = page.getByRole('checkbox', { name: `Mark "${title}" as open` });
  await done.waitFor();
  if (!(await done.isChecked())) throw new Error('note not marked done');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await done.waitFor();

  await page.getByRole('button', { name: `Delete "${title}"` }).click();
  await page.getByText(title).waitFor({ state: 'detached' });
  console.log('smoke passed');
} finally {
  await browser.close();
}
