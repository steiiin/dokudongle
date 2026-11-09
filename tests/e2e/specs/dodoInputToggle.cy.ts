export {}

const toggle = (id: string) => cy.get(`[data-case="${id}"] ion-toggle`)

describe('DodoInputToggle', () => {
  for (const mode of ['ios', 'md']) {
    for (const dark of [false, true]) {
      it(`preserves defaults and interaction in ${mode}, ${dark ? 'dark' : 'light'}`, () => {
        cy.viewport(390, 900)
        cy.visit(`/tests/e2e/fixtures/dodoInputToggle.html?mode=${mode}${dark ? '&dark' : ''}`)
        cy.get('ion-item').should('have.length', 2)
        cy.get('ion-item ion-item').should('not.exist')
        toggle('default').should('have.class', 'ios').and('have.prop', 'checked', false)

        toggle('default').click()
        cy.get('#state').should('have.text', 'true')
        cy.get('#changes').should('have.text', '1')
        toggle('default').should('have.prop', 'checked', true)
        toggle('disabled').should('have.prop', 'disabled', true).click({ force: true })
        cy.get('#changes').should('have.text', '1')

        toggle('default').focus()
        const params = { key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }
        cy.then(() => Cypress.automation('remote:debugger:protocol', {
          command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyDown', text: ' ' },
        }))
        cy.then(() => Cypress.automation('remote:debugger:protocol', {
          command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyUp' },
        }))
        cy.get('#state').should('have.text', 'false')
        cy.get('#changes').should('have.text', '2')
        toggle('default').should('have.prop', 'checked', false)
      })
    }
  }
})
