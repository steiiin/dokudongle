describe('Spellchecker settings on mobile', () => {
  for (const width of [320, 375]) {
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
        cy.contains('ion-modal:visible ion-button', 'Fertig').click()
        cy.get('ion-modal:visible').should('not.exist')
      }
      const fill = (name: string, value: string) => {
        cy.get('ion-modal:visible ion-input').filter((_index, element) => (element as HTMLElement & { label?: string }).label === name).find('input').clear().type(value)
      }
      const checkLayout = () => {
        cy.get('ion-modal:visible ion-toolbar ion-button, ion-modal:visible form ion-input').each(element => {
          const bounds = element[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(width)
        })
        cy.get('ion-modal:visible tbody ion-button').first().shadow().find('button').should('have.attr', 'aria-label').and('match', / entfernen$/)
        cy.get('ion-modal:visible .table-scroll').then(element => {
          expect(element[0].getBoundingClientRect().right).to.be.at.most(width)
        })
      }

      open('Eigenes Wörterbuch')
      cy.get('ion-modal:visible ion-title').should('contain.text', 'Eigenes Wörterbuch')
      close()
      open('Shortcut-Ersetzungen')
      cy.contains('ion-modal:visible ion-button', 'Zurücksetzen').click()
      cy.get('ion-modal:visible tbody tr').should('have.length', 5)
      fill('Shortcut', 'mobil')
      fill('Ersetzung', 'Mobiler Wunschtext')
      cy.contains('ion-modal:visible ion-button', 'Hinzufügen').click()
      cy.contains('ion-modal:visible tbody tr', 'mobil').should('contain.text', 'Mobiler Wunschtext')
      checkLayout()
      cy.screenshot(`spellchecker-shortcuts-${width}`)
      close()
      cy.reload()
      open('Shortcut-Ersetzungen')
      cy.contains('ion-modal:visible tbody tr', 'mobil').should('contain.text', 'Mobiler Wunschtext')
      const deleteFirst = () => cy.get('ion-modal:visible tbody tr').first().find('ion-button').click()
      for (let i = 0; i < 6; i++) {
        deleteFirst()
        cy.get('ion-modal:visible tbody tr').should('have.length', 5 - i)
      }
      cy.contains('ion-modal:visible ion-button', 'Standard-Shortcuts wiederherstellen').should('have.attr', 'color', 'primary')
      close()
      cy.reload()
      open('Shortcut-Ersetzungen')
      cy.get('ion-modal:visible table').should('not.exist')
      cy.contains('ion-modal:visible ion-button', 'Standard-Shortcuts wiederherstellen').click()
      cy.get('ion-modal:visible tbody tr').should('have.length', 5)
      close()

      open('Orts-Snippets')
      cy.contains('ion-modal:visible ion-button', 'Zurücksetzen').click()
      cy.get('ion-modal:visible tbody tr').should('have.length', 13)
      cy.screenshot(`spellchecker-location-form-${width}`)
      fill('Auslöser', '#')
      fill('Bezeichnung', 'Mobiler Ort')
      fill('Ersetzung', 'Ziel: Mobiler Ort')
      fill('Suchbegriffe (optional)', 'mobil, ziel')
      fill('Kategorie (optional)', 'test')
      cy.contains('ion-modal:visible ion-button', 'Hinzufügen').click()
      cy.get('ion-modal:visible tbody tr').should('have.length', 14)
      cy.contains('ion-modal:visible tbody tr', 'Mobiler Ort').should('contain.text', '#').and('contain.text', 'mobil, ziel').and('contain.text', 'test')
      checkLayout()
      cy.screenshot(`spellchecker-locations-${width}`)
      close()
      cy.reload()
      open('Orts-Snippets')
      cy.contains('ion-modal:visible tbody tr', 'Mobiler Ort').should('contain.text', 'Ziel: Mobiler Ort')
      for (let i = 0; i < 14; i++) {
        deleteFirst()
        cy.get('ion-modal:visible tbody tr').should('have.length', 13 - i)
      }
      cy.contains('ion-modal:visible ion-button', 'Standard-Orts-Snippets wiederherstellen').should('have.attr', 'color', 'primary')
      close()
      cy.reload()
      open('Orts-Snippets')
      cy.get('ion-modal:visible table').should('not.exist')
      cy.contains('ion-modal:visible ion-button', 'Standard-Orts-Snippets wiederherstellen').click()
      cy.get('ion-modal:visible tbody tr').should('have.length', 13)
      close()
    })
  }
})
