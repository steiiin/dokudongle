describe('Spellchecker settings on mobile', () => {
  for (const width of [320, 375, 1024]) {
    it(`manages persistent shortcuts and locations at ${width}px`, () => {
      cy.viewport(width, 812)
      cy.visit('/tabs/settings')
      cy.get('[data-testid="spellchecker-settings"]', { timeout: 15000 }).should('be.visible')
      const open = (name: string) => {
        cy.contains('[data-testid="spellchecker-settings"] ion-item', name).click()
        cy.get('ion-modal:visible').should('be.visible').should(modal => {
          expect(modal[0].getAnimations({ subtree: true }).filter(animation => animation.playState === 'running')).to.have.length(0)
        })
      }
      const close = () => {
        cy.get('ion-modal:visible ion-button[title="Zurück"]').shadow().find('button[aria-label="Zurück"]').click()
        cy.get('ion-modal:visible').should('not.exist')
      }
      const fill = (name: string, value: string) => {
        cy.get('ion-modal:visible ion-input').filter((_index, element) => (element as HTMLElement & { label?: string }).label === name).find('input').clear().type(value)
      }
      const answerAlert = (answer: 'Abbrechen' | 'Zurücksetzen' | 'Löschen') => {
        cy.contains('ion-alert:visible button', answer).click()
        cy.get('ion-alert:visible').should('not.exist')
      }
      const cancelReset = () => {
        cy.contains('ion-modal:visible ion-button', 'Zurücksetzen').click()
        answerAlert('Abbrechen')
      }
      const checkLayout = () => {
        cy.get('ion-modal:visible ion-title').should('be.visible').then(title => {
          expect(title[0].getBoundingClientRect().width).to.be.greaterThan(0)
        })
        cy.get('ion-modal:visible ion-toolbar ion-button, ion-modal:visible form ion-input').each(element => {
          const bounds = element[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(width)
        })
        cy.get('ion-modal:visible .delete-entry').should('not.exist')
        cy.get('ion-modal:visible .text-assist-entry-list:visible').first().then(element => {
          expect(element[0].getBoundingClientRect().right).to.be.at.most(width)
        })
      }

      open('Eigenes Wörterbuch')
      cy.get('ion-modal:visible ion-title').should('contain.text', 'Eigenes Wörterbuch')
      close()
      open('Shortcut-Ersetzungen')
      cy.contains('ion-modal:visible ion-button', 'Zurücksetzen').click()
      answerAlert('Zurücksetzen')
      cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 5)
      cy.contains('ion-modal:visible ion-button', 'Neuer Shortcut').click()
      fill('Shortcut', 'mobil')
      fill('Ersetzung', 'Mobiler Wunschtext')
      cy.contains('ion-modal:visible ion-button', 'Speichern').click()
      cancelReset()
      cy.contains('ion-modal:visible .text-assist-entry-list ion-item', 'mobil').should('contain.text', 'Mobiler Wunschtext')
      checkLayout()
      cy.screenshot(`spellchecker-shortcuts-${width}`)
      close()
      cy.reload()
      open('Shortcut-Ersetzungen')
      cy.contains('ion-modal:visible .text-assist-entry-list ion-item', 'mobil').should('contain.text', 'Mobiler Wunschtext')
      const deleteFirst = (checkCancellation = false) => {
        cy.get('ion-modal:visible').then(modal => {
          const accordion = modal.find('ion-accordion').first()
          if (accordion.length && !accordion.hasClass('accordion-expanded')) cy.wrap(accordion).find('ion-item[slot=header]').click()
        })
        cy.get('ion-modal:visible .text-assist-entry-list:visible ion-item').first().find('ion-label').click()
        cy.get('ion-modal:visible form .delete-entry').shadow().find('button').should('have.attr', 'aria-label').and('match', / entfernen$/)
        cy.get('ion-modal:visible form .delete-entry').click()
        if (checkCancellation) {
          answerAlert('Abbrechen')
          cy.get('ion-modal:visible form').should('be.visible')
          cy.get('ion-modal:visible form .delete-entry').click()
        }
        answerAlert('Löschen')
        cy.get('ion-modal:visible form').should('not.exist')
      }
      for (let i = 0; i < 6; i++) {
        deleteFirst(i === 0)
        cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 5 - i)
      }
      cy.contains('ion-modal:visible ion-button', 'Standard-Shortcuts wiederherstellen').should('have.attr', 'color', 'primary')
      close()
      cy.reload()
      open('Shortcut-Ersetzungen')
      cy.get('ion-modal:visible .text-assist-entry-list').should('not.exist')
      cy.contains('ion-modal:visible ion-button', 'Standard-Shortcuts wiederherstellen').click()
      answerAlert('Abbrechen')
      cy.get('ion-modal:visible .text-assist-entry-list').should('not.exist')
      cy.contains('ion-modal:visible ion-button', 'Standard-Shortcuts wiederherstellen').click()
      answerAlert('Zurücksetzen')
      cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 5)
      close()

      open('Orts-Snippets')
      cy.contains('ion-modal:visible ion-button', 'Zurücksetzen').click()
      answerAlert('Zurücksetzen')
      cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 13)
      cy.contains('ion-modal:visible ion-button', 'Neues Snippet').click()
      cy.get('ion-modal:visible .text-assist-entry-list').should('not.exist')
      cy.screenshot(`spellchecker-location-form-${width}`)
      fill('Bezeichnung', 'Mobiler Ort')
      fill('Suchbegriffe (optional)', 'mobil, ziel')
      fill('Kategorie (optional)', 'test')
      cy.contains('ion-modal:visible ion-button', 'Speichern').click()
      cancelReset()
      cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 14)
      cy.get('ion-modal:visible ion-accordion').should('have.length', 2)
      cy.contains('ion-modal:visible ion-accordion ion-item[slot=header]', 'test').click()
      cy.contains('ion-modal:visible .text-assist-entry-list ion-item', 'Mobiler Ort').should('be.visible').and('contain.text', 'mobil, ziel')
      cy.contains('ion-modal:visible ion-accordion ion-item[slot=header]', 'test').closest('ion-accordion').should('have.class', 'accordion-expanded')
      checkLayout()
      cy.screenshot(`spellchecker-locations-${width}`)
      close()
      cy.reload()
      open('Orts-Snippets')
      cy.contains('ion-modal:visible ion-accordion ion-item[slot=header]', 'test').click()
      cy.contains('ion-modal:visible .text-assist-entry-list ion-item ion-label', 'Mobiler Ort').click()
      fill('Bezeichnung', 'Bearbeiteter Ort')
      cy.contains('ion-modal:visible ion-button', 'Speichern').click()
      cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 14)
      cy.contains('ion-modal:visible ion-accordion ion-item[slot=header]', 'test').click()
      cy.contains('ion-modal:visible .text-assist-entry-list ion-item', 'Bearbeiteter Ort').should('be.visible')
      cy.contains('ion-modal:visible ion-accordion ion-item[slot=header]', 'hospital').click()
      for (let i = 0; i < 14; i++) {
        deleteFirst(i === 0)
        cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 13 - i)
      }
      cy.contains('ion-modal:visible ion-button', 'Standard-Orts-Snippets wiederherstellen').should('have.attr', 'color', 'primary')
      close()
      cy.reload()
      open('Orts-Snippets')
      cy.get('ion-modal:visible .text-assist-entry-list').should('not.exist')
      cy.contains('ion-modal:visible ion-button', 'Standard-Orts-Snippets wiederherstellen').click()
      answerAlert('Abbrechen')
      cy.get('ion-modal:visible .text-assist-entry-list').should('not.exist')
      cy.contains('ion-modal:visible ion-button', 'Standard-Orts-Snippets wiederherstellen').click()
      answerAlert('Zurücksetzen')
      cy.get('ion-modal:visible .text-assist-entry-list ion-item').should('have.length', 13)
      close()
    })
  }
})
