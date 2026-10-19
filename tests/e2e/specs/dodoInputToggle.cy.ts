export {}

const toggle = (id: string) => cy.get(`[data-case="${id}"] ion-toggle`)

const expectColor = (id: string, expected: string) => {
  toggle(id).shadow().find('[part="track"]').should('have.css', 'background-color', expected)
  toggle(id).shadow().find('[part="label"]').should('have.css', 'color', expected)
  toggle(id).shadow().find('[part="handle"]').should('not.have.css', 'background-color', expected)
}

const expectDefault = (id: string) => {
  for (const [part, property] of [['track', 'background-color'], ['handle', 'background-color'], ['label', 'color']]) {
    toggle(id).shadow().find(`[part="${part}"]`).should(element => {
      const defaultToggle = element[0].ownerDocument.querySelector('[data-case="default"] ion-toggle')!
      const defaultPart = defaultToggle.shadowRoot!.querySelector(`[part="${part}"]`)!
      // Re-read both styles on retry so an in-flight Ionic transition cannot freeze the expectation.
      expect(getComputedStyle(element[0]).getPropertyValue(property))
        .to.equal(getComputedStyle(defaultPart).getPropertyValue(property))
    })
  }
}

describe('DodoInputToggle', () => {
  for (const mode of ['ios', 'md']) {
    for (const dark of [false, true]) {
      it(`preserves state colors, defaults and interaction in ${mode}, ${dark ? 'dark' : 'light'}`, () => {
        cy.viewport(390, 900)
        cy.visit(`/tests/e2e/fixtures/dodoInputToggle.html?mode=${mode}${dark ? '&dark' : ''}`)
        cy.get('ion-item').should('have.length', 9)
        cy.get('ion-item ion-item').should('not.exist')
        toggle('default').should('have.class', mode).and('have.prop', 'checked', false)

        const checkColors = (checked: boolean) => {
          for (const [color, themeColor] of [['green', 'success'], ['yellow', 'warning'], ['red', 'danger']]) {
            cy.get(`[data-color="${themeColor}"]`).then(element => {
              expectColor(color, getComputedStyle(element[0]).color)
            })
          }
          expectColor('orange', 'rgb(255, 152, 0)')
          cy.get(`[data-color="${checked ? 'success' : 'danger'}"]`).then(element => {
            expectColor('mixed', getComputedStyle(element[0]).color)
          })
          expectDefault(checked ? 'off-only' : 'on-only')
          expectColor(checked ? 'on-only' : 'off-only', 'rgb(255, 152, 0)')
        }

        checkColors(false)
        toggle('green').click()
        cy.get('#state').should('have.text', 'true')
        cy.get('#changes').should('have.text', '1')
        checkColors(true)
        toggle('disabled').should('have.prop', 'disabled', true).click({ force: true })
        cy.get('#changes').should('have.text', '1')

        toggle('green').focus()
        const params = { key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }
        cy.then(() => Cypress.automation('remote:debugger:protocol', {
          command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyDown', text: ' ' },
        }))
        cy.then(() => Cypress.automation('remote:debugger:protocol', {
          command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyUp' },
        }))
        cy.get('#state').should('have.text', 'false')
        cy.get('#changes').should('have.text', '2')
        checkColors(false)
      })
    }
  }
})
