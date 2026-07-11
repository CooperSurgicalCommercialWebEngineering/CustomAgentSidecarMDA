import { test, expect } from '@playwright/test';

test.describe('Agent Sidecar Administration', () => {
  test('shows portfolio health and opens the creation wizard', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { name: 'Sidecar portfolio' })).toBeVisible();
    await expect(page.getByText('HR Management App Guide')).toBeVisible();
    await expect(page.getByText('Field Operations Assistant')).toBeVisible();
    await expect(page.getByText('Finance Operations Guide')).toBeVisible();
    await page.getByRole('button', { name: 'Create sidecar' }).click();
    await expect(page.getByRole('heading', { name: 'Create a sidecar' })).toBeVisible();
    await expect(page.getByText('Sales Workspace')).toBeVisible();
  });

  test('creates and deploys a sidecar through the guided workflow', async ({ page }) => {
    const environmentId = 'f9b87f8b-0abf-e629-affb-b13195d1ed14';
    await page.goto('/#/new');
    const salesApp = page.getByRole('button', { name: /Sales Workspace Accounts/ });
    await salesApp.click();
    await expect(salesApp).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Select tables' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('textbox', { name: 'Microsoft 365 Agents SDK connection string' }).fill(
      'https://1234567890.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/contoso_SalesAssistant/conversations?api-version=2022-03-01-preview',
    );
    await page.getByRole('textbox', { name: 'Environment ID' }).fill(environmentId);
    await page.getByRole('button', { name: 'Resolve agent' }).click();
    await expect(page.getByText(/contoso_SalesAssistant · published/)).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('textbox', { name: 'Tenant ID' }).fill(environmentId);
    await page.getByRole('textbox', { name: 'Public-client Application ID' }).fill('9d03cd77-5246-4c9c-8e9d-262bff547a25');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Review deployment impact' })).toBeVisible();
    await page.getByRole('button', { name: 'Deploy sidecar' }).click();
    await expect(page.getByRole('heading', { name: 'Sales Workspace Assistant' })).toBeVisible();
    await expect(page.getByText('Deployment completed and live metadata read-back passed.')).toBeVisible();
  });

  test('reviews and explicitly reconciles drift', async ({ page }) => {
    await page.goto('/#/sidecars/sidecar-field-operations');
    await expect(page.getByRole('heading', { name: 'Drift review' })).toBeVisible();
    await expect(page.getByText('Account was added to the target app')).toBeVisible();
    await page.getByRole('button', { name: 'Approve reconciliation' }).click();
    await expect(page.getByRole('heading', { name: 'Drift review' })).toBeHidden();
    await expect(page.getByText('Administrator-approved reconciliation completed and read-back passed.')).toBeVisible();
  });

  test('disables and re-enables a configuration', async ({ page }) => {
    await page.goto('/#/sidecars/sidecar-hr-management');
    await page.getByRole('button', { name: 'Disable' }).click();
    await expect(page.getByRole('button', { name: 'Enable' })).toBeVisible();
    await page.getByRole('button', { name: 'Enable' }).click();
    await expect(page.getByRole('button', { name: 'Disable' })).toBeVisible();
  });

  test('requires confirmation for scoped uninstall', async ({ page }) => {
    await page.goto('/#/sidecars/sidecar-finance-operations');
    await expect(page.getByText('Rollback incomplete')).toBeVisible();
    await page.getByRole('button', { name: 'Uninstall sidecar' }).click();
    await expect(page.getByRole('dialog')).toContainText('Dependency checks run first');
    await page.getByRole('button', { name: 'Confirm scoped uninstall' }).click();
    await expect(page.getByRole('heading', { name: 'Sidecar portfolio' })).toBeVisible();
    await expect(page.getByText('Finance Operations Guide')).toBeHidden();
  });
});
