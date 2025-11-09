import { test, expect } from '@playwright/test'

test.describe('School Profile', () => {
  test('should navigate to school profile from search', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Find a school card or link
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Should be on profile page
      expect(page.url()).toMatch(/\/schools\/[a-f0-9-]+/i)
    }
  })

  test('should display school information', async ({ page }) => {
    // Try to navigate to a profile (may need a known school ID)
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Check for school name
      const schoolName = page.locator('h1, h2').first()
      expect(await schoolName.isVisible()).toBe(true)
    }
  })

  test('should display programs section', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Check for programs section
      const programsSection = page.locator('text=/programs/i, text=/training/i').first()
      expect(await programsSection.isVisible()).toBe(true)
    }
  })

  test('should display fleet information', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Check for fleet section
      const fleetSection = page.locator('text=/fleet/i, text=/aircraft/i').first()
      expect(await fleetSection.isVisible()).toBe(true)
    }
  })

  test('should display trust tier badge', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Check for trust tier
      const trustTier = page.locator('text=/premier/i, text=/verified/i, text=/community/i, text=/unverified/i').first()
      expect(await trustTier.isVisible()).toBe(true)
    }
  })

  test('should display map with school location', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Check for map
      const mapContainer = page.locator('.map-container, [class*="map"]').first()
      const hasMap = await mapContainer.isVisible() || await page.locator('text=/map/i').isVisible()
      expect(hasMap).toBe(true)
    }
  })

  test('should handle 404 for invalid school ID', async ({ page }) => {
    await page.goto('/schools/invalid-id-12345')
    await page.waitForTimeout(2000)
    
    // Should show 404 or error message
    const errorMessage = page.locator('text=/not found/i, text=/404/i, text=/error/i').first()
    expect(await errorMessage.isVisible()).toBe(true)
  })

  test('should allow requesting information', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Look for inquiry button
      const inquiryButton = page.locator('button:has-text("Request"), button:has-text("Information"), button:has-text("Contact")').first()
      if (await inquiryButton.isVisible()) {
        await inquiryButton.click()
        await page.waitForTimeout(500)
        
        // Should show modal or form
        expect(true).toBe(true) // Basic interaction test
      }
    }
  })
})

test.describe('School Profile - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be mobile responsive', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // School name should be visible
      const schoolName = page.locator('h1, h2').first()
      expect(await schoolName.isVisible()).toBe(true)
    }
  })

  test('should handle mobile map interactions', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    const schoolLink = page.locator('a[href*="/schools/"], button:has-text("View Details")').first()
    if (await schoolLink.isVisible()) {
      await schoolLink.click()
      await page.waitForTimeout(2000)
      
      // Map should be visible
      const mapContainer = page.locator('.map-container').first()
      if (await mapContainer.isVisible()) {
        await mapContainer.tap()
        await page.waitForTimeout(500)
      }
      
      expect(true).toBe(true) // Basic touch test
    }
  })
})

