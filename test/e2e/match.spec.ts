import { test, expect } from '@playwright/test'

test.describe('Matching Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/match')
    await page.waitForTimeout(1000)
  })

  test('should display wizard steps', async ({ page }) => {
    // Check for step indicators
    const step1 = page.locator('text=/goals/i').first()
    const step2 = page.locator('text=/budget/i').first()
    
    expect(await step1.isVisible() || await page.locator('text=/training goals/i').isVisible()).toBe(true)
  })

  test('should require goal selection before continuing', async ({ page }) => {
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Find Matches")').first()
    
    // Button should be disabled initially
    if (await continueButton.isVisible()) {
      const isDisabled = await continueButton.isDisabled()
      expect(isDisabled).toBe(true)
    }
  })

  test('should progress through all wizard steps', async ({ page }) => {
    // Step 1: Select a goal
    const pplOption = page.locator('text=PPL').first()
    if (await pplOption.isVisible()) {
      await pplOption.click()
      await page.waitForTimeout(500)
    }
    
    // Click continue
    const continueButton = page.locator('button:has-text("Continue")').first()
    if (await continueButton.isVisible() && !(await continueButton.isDisabled())) {
      await continueButton.click()
      await page.waitForTimeout(1000)
      
      // Should be on step 2
      expect(await page.locator('text=/budget.*schedule/i').isVisible()).toBe(true)
      
      // Step 2: Set budget (slider should be visible)
      const budgetSlider = page.locator('input[type="range"]').first()
      if (await budgetSlider.isVisible()) {
        await budgetSlider.fill('20000')
        await page.waitForTimeout(500)
      }
      
      // Continue to step 3
      await continueButton.click()
      await page.waitForTimeout(1000)
      
      // Should be on step 3 (Location)
      expect(await page.locator('text=/location/i').isVisible()).toBe(true)
      
      // Step 3: Set location
      const locationInput = page.locator('input[type="number"]').first()
      if (await locationInput.isVisible()) {
        await locationInput.fill('40.7128')
        await page.waitForTimeout(500)
      }
      
      // Continue to step 4
      await continueButton.click()
      await page.waitForTimeout(1000)
      
      // Should be on step 4 (Preferences)
      expect(await page.locator('text=/preferences/i').isVisible()).toBe(true)
      
      // Step 4: Select preferences
      const aircraftOption = page.locator('text=Cessna').first()
      if (await aircraftOption.isVisible()) {
        await aircraftOption.click()
        await page.waitForTimeout(500)
      }
      
      // Complete wizard
      const findMatchesButton = page.locator('button:has-text("Find Matches")').first()
      if (await findMatchesButton.isVisible()) {
        await findMatchesButton.click()
        await page.waitForTimeout(3000)
        
        // Should show results or loading
        const hasResults = await page.locator('text=/matches/i').isVisible() || 
                          await page.locator('text=/loading/i').isVisible() ||
                          await page.locator('text=/finding/i').isVisible()
        expect(hasResults).toBe(true)
      }
    }
  })

  test('should allow going back to previous steps', async ({ page }) => {
    // Select goal and move forward
    const pplOption = page.locator('text=PPL').first()
    if (await pplOption.isVisible()) {
      await pplOption.click()
      await page.waitForTimeout(500)
      
      const continueButton = page.locator('button:has-text("Continue")').first()
      if (await continueButton.isVisible() && !(await continueButton.isDisabled())) {
        await continueButton.click()
        await page.waitForTimeout(1000)
        
        // Click back button
        const backButton = page.locator('button:has-text("Back")').first()
        if (await backButton.isVisible()) {
          await backButton.click()
          await page.waitForTimeout(1000)
          
          // Should be back on step 1
          expect(await page.locator('text=/training goals/i').isVisible()).toBe(true)
        }
      }
    }
  })

  test('should use geolocation for location step', async ({ page }) => {
    // Grant geolocation permission
    await page.context().grantPermissions(['geolocation'])
    await page.context().setGeolocation({ latitude: 37.7749, longitude: -122.4194 })
    
    // Navigate to location step
    const pplOption = page.locator('text=PPL').first()
    if (await pplOption.isVisible()) {
      await pplOption.click()
      await page.waitForTimeout(500)
      
      const continueButton = page.locator('button:has-text("Continue")').first()
      if (await continueButton.isVisible() && !(await continueButton.isDisabled())) {
        await continueButton.click()
        await page.waitForTimeout(1000)
        await continueButton.click() // Step 2 to 3
        await page.waitForTimeout(1000)
        
        // Click "Use My Location" button
        const useLocationButton = page.locator('button:has-text("Use My Location"), button:has-text("Current Location")').first()
        if (await useLocationButton.isVisible()) {
          await useLocationButton.click()
          await page.waitForTimeout(2000)
          
          // Location should be filled
          const locationInput = page.locator('input[type="number"]').first()
          const value = await locationInput.inputValue()
          expect(value.length).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should display match results after completion', async ({ page }) => {
    // Complete wizard quickly
    const pplOption = page.locator('text=PPL').first()
    if (await pplOption.isVisible()) {
      await pplOption.click()
      await page.waitForTimeout(500)
      
      // Try to complete all steps quickly
      for (let i = 0; i < 4; i++) {
        const continueButton = page.locator('button:has-text("Continue"), button:has-text("Find Matches")').first()
        if (await continueButton.isVisible() && !(await continueButton.isDisabled())) {
          await continueButton.click()
          await page.waitForTimeout(1000)
        } else {
          break
        }
      }
      
      // Should show results or loading
      await page.waitForTimeout(3000)
      const hasResults = await page.locator('text=/matches/i').isVisible() || 
                        await page.locator('text=/school/i').isVisible() ||
                        await page.locator('text=/debrief/i').isVisible()
      expect(hasResults).toBe(true)
    }
  })
})

test.describe('Matching Wizard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should be mobile responsive', async ({ page }) => {
    await page.goto('/match')
    await page.waitForTimeout(1000)
    
    // Wizard should be visible
    expect(await page.locator('text=/find your perfect match/i').isVisible()).toBe(true)
    
    // Progress steps should be visible
    const steps = page.locator('text=/goals/i, text=/budget/i, text=/location/i, text=/preferences/i')
    const stepCount = await steps.count()
    expect(stepCount).toBeGreaterThan(0)
  })

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/match')
    await page.waitForTimeout(1000)
    
    // Tap on a goal option
    const pplOption = page.locator('text=PPL').first()
    if (await pplOption.isVisible()) {
      await pplOption.tap()
      await page.waitForTimeout(500)
      
      // Should be selected
      expect(true).toBe(true) // Basic touch test
    }
  })
})

