export {}

const modal = () => cy.get('ion-modal:visible')
const chips = () => modal().find('.dodo-saatreats-chip')
const chip = (label: string) => cy.contains('ion-modal:visible .dodo-saatreats-chip', label)
const open = () => cy.contains('ion-button', 'Invasives hinzufügen').click()
const save = () => cy.contains('ion-modal:visible ion-button', 'Speichern').click()
const saved = (ids: string[]) => cy.get('[data-testid="saved"]').should('have.text', JSON.stringify(ids))

describe('Invasive procedure selection', () => {
  for (const dark of [false, true]) {
    it(`supports grouped selection, keyboard, search and clearing on mobile in ${dark ? 'dark' : 'light'} mode`, () => {
      cy.viewport(390, 844)
      cy.visit(`/tests/e2e/fixtures/dodoInputSaatreats.html${dark ? '?dark' : ''}`)
      open()
      modal().find('ion-buttons[slot="start"] ion-button').shadow().find('button')
        .should('have.attr', 'aria-label', 'Abbrechen')
      modal().find('ion-buttons[slot="end"]').should('contain.text', 'Speichern')
      modal().find('ion-item-divider').should('have.length', 2)
      chips().should('have.length', 6)
      // The first group wraps and every chip remains inside the mobile viewport.
      modal().find('.dodo-saatreats-chips').first().find('.dodo-saatreats-chip').should(elements => {
        const boxes = [...elements].map(element => element.getBoundingClientRect())
        expect(new Set(boxes.map(box => Math.round(box.top))).size).to.be.greaterThan(1)
        boxes.forEach(box => {
          expect(box.left).to.be.at.least(0)
          expect(box.right).to.be.at.most(390)
        })
      })
      chip('PVK 20 G').focus().type('{enter}').should('have.attr', 'aria-pressed', 'true')
      chip('PVK 18 G').should('not.exist')
      chip('PVK 22 G').should('not.exist')
      chip('Intraossärer Zugang').focus().type(' ').should('have.attr', 'aria-pressed', 'true')
      chip('Endotracheale Intubation').click().should('have.attr', 'aria-pressed', 'true')
      saved([])
      cy.screenshot(`saatreats-selected-${dark ? 'dark' : 'light'}`)
      modal().find('ion-searchbar input').type('atemweg')
      chips().should('have.length', 2)
      modal().find('ion-searchbar input').clear()
      chip('PVK 20 G').should('have.attr', 'aria-pressed', 'true')
      save()
      cy.get('ion-modal:visible').should('not.exist')
      saved(['pvk-20g', 'intraossaer', 'endotracheal'])
      cy.get('.dodo-saatreats-input ion-item').then(items => {
        expect([...items].map(item => item.textContent?.trim()))
          .to.deep.equal(['PVK 20 G', 'Intraossärer Zugang', 'Endotracheale Intubation'])
      })
      // Exercise Ionic's drag gesture rather than dispatching a reorder event.
      cy.get('.dodo-saatreats-input ion-reorder').last().then(handle => {
        const start = handle[0].getBoundingClientRect()
        cy.get('.dodo-saatreats-input ion-item').first().then(item => {
          const target = item[0].getBoundingClientRect()
          const clientX = start.left + start.width / 2
          const clientY = start.top + start.height / 2
          // Real mouse events cross the item's shadow DOM boundary.
          const mouseEvent = { eventConstructor: 'MouseEvent', composed: true, button: 0, clientX }
          cy.wrap(handle).trigger('mousedown', { ...mouseEvent, buttons: 1, clientY })
          cy.wrap(handle).closest('ion-item').should('have.class', 'reorder-selected')
          cy.document().trigger('mousemove', { ...mouseEvent, buttons: 1, clientY: target.top + target.height / 2 })
          cy.wrap(handle).closest('ion-item').should('have.attr', 'style').and('contain', 'translateY')
          cy.document().trigger('mouseup', { ...mouseEvent, clientY: target.top + target.height / 2 })
        })
      })
      saved(['endotracheal', 'pvk-20g', 'intraossaer'])
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('.dodo-saatreats-input ion-item').should(items => {
        expect([...items].map(item => item.textContent?.trim()))
          .to.deep.equal(['Endotracheale Intubation', 'PVK 20 G', 'Intraossärer Zugang'])
      })
      cy.get('.dodo-saatreats-input ion-reorder').first().click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.contains('.dodo-saatreats-input ion-item', 'PVK 20 G').click()
      save()
      cy.get('ion-modal:visible').should('not.exist')
      saved(['endotracheal', 'pvk-20g', 'intraossaer'])
      cy.contains('.dodo-saatreats-input ion-item', 'PVK 20 G').click()
      chip('PVK 20 G').should('have.attr', 'aria-pressed', 'true').click()
      chip('PVK 18 G').should('be.visible')
      chip('PVK 22 G').should('be.visible')
      chip('Intraossärer Zugang').click()
      chip('Endotracheale Intubation').click()
      save()
      cy.get('ion-modal:visible').should('not.exist')
      saved([])
      cy.get('.dodo-saatreats-input ion-item').should('not.exist')
    })
  }

  it('discards drafts on X, Escape, backdrop and Ionic back dismissal', () => {
    cy.viewport(1000, 900)
    cy.visit('/tests/e2e/fixtures/dodoInputSaatreats.html')
    open()
    chip('PVK 20 G').click()
    save()
    cy.get('ion-modal:visible').should('not.exist')

    for (const method of ['x', 'escape', 'backdrop', 'back']) {
      open()
      chip('PVK 20 G').should('have.attr', 'aria-pressed', 'true').click()
      chip('PVK 18 G').click()
      if (method === 'x') modal().find('ion-buttons[slot="start"] ion-button').click()
      if (method === 'escape') modal().find('ion-searchbar input').type('{esc}')
      if (method === 'backdrop') modal().shadow().find('ion-backdrop').click('topLeft', { force: true })
      if (method === 'back') {
        // Exercise the handler Ionic registers for Android's hardware back event.
        cy.document().then(document => {
          const handlers: { priority: number, handler: (next: () => void) => void }[] = []
          document.dispatchEvent(new CustomEvent('ionBackButton', { detail: {
            register: (priority: number, handler: (next: () => void) => void) => handlers.push({ priority, handler }),
          } }))
          expect(handlers.length).to.be.greaterThan(0)
          handlers.sort((a, b) => b.priority - a.priority)[0].handler(() => {})
        })
      }
      cy.get('ion-modal:visible').should('not.exist')
      saved(['pvk-20g'])
    }
    open()
    chip('PVK 20 G').should('have.attr', 'aria-pressed', 'true')
    chip('PVK 18 G').should('not.exist')
  })
})
