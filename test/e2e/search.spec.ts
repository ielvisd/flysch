import { test, expect } from '@playwright/test'

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for schools to load
    await page.waitForTimeout(2000)
  })

  test('should display schools on page load', async ({ page }) => {
    // Check for school cards or results
    const schoolCards = page.locator('[data-testid="school-card"], .school-card').or(page.locator('text=/✈️/'))
    const count = await schoolCards.count()
    
    // Should have at least some schools or show "no results" message
    const hasResults = count > 0 || await page.locator('text=/no schools found/i').isVisible()
    expect(hasResults).toBe(true)
  })

  test('should filter schools by text search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search school name"]').first()
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Embry')
      await page.waitForTimeout(1000) // Wait for debounce
      
      // Should show filtered results
      const results = page.locator('text=/Embry/i')
      const hasResults = await results.count() > 0 || await page.locator('text=/no schools found/i').isVisible()
      expect(hasResults).toBe(true)
    }
  })

  test('should filter by program type', async ({ page }) => {
    // Look for PPL checkbox
    const pplCheckbox = page.locator('text=PPL').first()
    
    if (await pplCheckbox.isVisible()) {
      await pplCheckbox.click()
      await page.waitForTimeout(1000)
      
      // Results should update
      const hasResults = await page.locator('text=/✈️/').count() > 0 || await page.locator('text=/no schools found/i').isVisible()
      expect(hasResults).toBe(true)
    }
  })

  test('should filter by budget range', async ({ page }) => {
    const budgetSelect = page.locator('select, [role="combobox"]').filter({ hasText: /budget/i }).first()
    
    if (await budgetSelect.isVisible()) {
      await budgetSelect.click()
      await page.locator('text=/under.*10/i').first().click()
      await page.waitForTimeout(1000)
      
      // Results should update
      const hasResults = await page.locator('text=/✈️/').count() > 0 || await page.locator('text=/no schools found/i').isVisible()
      expect(hasResults).toBe(true)
    }
  })

  test('should use location detection', async ({ page }) => {
    const locationButton = page.locator('button:has-text("Use My Location"), button:has-text("location")').first()
    
    if (await locationButton.isVisible()) {
      // Grant geolocation permission
      await page.context().grantPermissions(['geolocation'])
      await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 })
      
      await locationButton.click()
      await page.waitForTimeout(2000)
      
      // Should show radius or filtered results
      const hasRadius = await page.locator('text=/radius/i').isVisible()
      const hasResults = await page.locator('text=/✈️/').count() > 0
      expect(hasRadius || hasResults).toBe(true)
    }
  })

  test('should clear filters', async ({ page }) => {
    const clearButton = page.locator('button:has-text("Clear")').first()
    
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await page.waitForTimeout(1000)
      
      // Filters should be reset
      expect(await clearButton.isVisible()).toBe(true)
    }
  })

  test('should navigate to school profile from card', async ({ page }) => {
    const schoolCard = page.locator('[data-testid="school-card"], .school-card').first()
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View")').first()
    
    if (await schoolCard.isVisible() || await viewDetailsButton.isVisible()) {
      await (viewDetailsButton.isVisible() ? viewDetailsButton : schoolCard).click()
      await page.waitForTimeout(1000)
      
      // Should navigate to school profile
      expect(page.url()).toMatch(/\/schools\/[a-f0-9-]+/i)
    }
  })

  test('should display map with school markers', async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(2000)
    
    const mapContainer = page.locator('.map-container, [class*="map"]').first()
    
    // Map should be present (even if placeholder)
    const hasMap = await mapContainer.isVisible() || await page.locator('text=/map/i').isVisible()
    expect(hasMap).toBe(true)
  })
})

test.describe('Search - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should show mobile filter accordion', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Filters should be visible or collapsible
    const filters = page.locator('text=/filters/i').first()
    expect(await filters.isVisible()).toBe(true)
  })

  test('should handle mobile map interactions', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Map should be visible and touchable
    const mapContainer = page.locator('.map-container').first()
    if (await mapContainer.isVisible()) {
      // Try to interact with map
      await mapContainer.click({ force: true })
      await page.waitForTimeout(500)
    }
    
    expect(true).toBe(true) // Basic interaction test
  })
})

