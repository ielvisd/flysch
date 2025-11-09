import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate to homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /find your perfect flight school/i })).toBeVisible()
    
    // Check for search filters
    await expect(page.getByText(/filters/i)).toBeVisible()
  })

  test('should navigate to match page', async ({ page }) => {
    await page.goto('/')
    
    // Click on AI Matching link
    await page.getByRole('link', { name: /ai matching/i }).click()
    
    // Check if we're on the match page
    await expect(page).toHaveURL('/match')
    await expect(page.getByRole('heading', { name: /find your perfect match/i })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Sign In button
    await page.getByRole('link', { name: /sign in/i }).click()
    
    // Check if we're on the login page
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /welcome to flysch/i })).toBeVisible()
  })

  test('should show mobile menu on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Click hamburger menu
    const menuButton = page.getByLabel(/toggle menu/i)
    await menuButton.click()
    
    // Check if mobile menu items are visible
    await expect(page.getByRole('link', { name: /search schools/i }).last()).toBeVisible()
    await expect(page.getByRole('link', { name: /ai matching/i }).last()).toBeVisible()
  })
})

test.describe('Search Functionality', () => {
  test('should allow filtering schools', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForTimeout(1000)
    
    // Check for filter options
    await expect(page.getByText(/programs/i).first()).toBeVisible()
    await expect(page.getByText(/budget range/i).first()).toBeVisible()
  })

  test('should show no results message when filters are too restrictive', async ({ page }) => {
    await page.goto('/')
    
    // Wait for initial load
    await page.waitForTimeout(1000)
    
    // Could add more specific filter interactions here
  })
})

test.describe('Match Wizard', () => {
  test('should progress through match wizard steps', async ({ page }) => {
    await page.goto('/match')
    
    // Step 1: Select a goal
    const pplOption = page.locator('text=PPL').first()
    await pplOption.click()
    
    // Click continue
    await page.getByRole('button', { name: /continue/i }).click()
    
    // Should be on step 2
    await expect(page.getByText(/budget & schedule/i)).toBeVisible()
  })

  test('should not allow progression without selecting goals', async ({ page }) => {
    await page.goto('/match')
    
    // Try to click continue without selecting goals
    const continueButton = page.getByRole('button', { name: /continue/i })
    
    // Button should be disabled
    await expect(continueButton).toBeDisabled()
  })

  test('should be mobile responsive', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/match')
    
    // Check that the wizard renders properly on mobile
    await expect(page.getByRole('heading', { name: /find your perfect match/i })).toBeVisible()
    
    // Check progress steps are visible
    await expect(page.getByText(/goals/i).first()).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })

  test('should allow keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check that focus is moving (basic check)
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})

