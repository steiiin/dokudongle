export {}

const pressKey = (key: 'Enter' | 'Escape' | ' ') => {
  const params = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: key === 'Enter' ? 13 : key === 'Escape' ? 27 : 32 }
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyDown', text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : '' },
  }))
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyUp' },
  }))
}

const tapOutside = (x: number, y: number) => {
  cy.get('ion-modal:visible').shadow().find('[part="content"]').should(content => {
    expect(content[0].getAnimations().some(animation => animation.playState === 'running')).to.equal(false)
  })
  // Use browser hit testing across the modal's shadow root. Cypress synthetic
  // clicks on the modal host do not reliably reach Ionic's backdrop listener.
  cy.window().then(async win => {
    const frame = window.top!.document.querySelector('iframe.aut-iframe')!.getBoundingClientRect()
    const position = {
      x: frame.left + x * frame.width / win.innerWidth,
      y: frame.top + y * frame.height / win.innerHeight,
      button: 'left',
      clickCount: 1,
    }
    for (const type of ['mousePressed', 'mouseReleased']) {
      await Cypress.automation('remote:debugger:protocol', {
        command: 'Input.dispatchMouseEvent', params: { ...position, type },
      })
    }
  })
}

describe('DodoInputSelectChips', () => {
  for (const width of [320, 1024]) {
    for (const dark of [false, true]) {
      it(`supports selection, keyboard and custom input at ${width}px in ${dark ? 'dark' : 'light'} mode`, () => {
        cy.viewport(width, 812)
        cy.visit(`/tests/e2e/fixtures/dodoInputSelectChips.html${dark ? '?dark' : ''}`)
        cy.get('.dd-input-select-chips').as('trigger').focus()
        pressKey('Enter')
        cy.get('ion-modal:visible').as('dialog').should('be.visible')
        cy.get('@dialog').shadow().find('[role="dialog"]').should('have.attr', 'aria-label', 'Auswahl mit ausführlicher Beschreibung')
        cy.get('@dialog').find('h2').should('have.text', 'Auswahl mit ausführlicher Beschreibung')
        cy.get('@dialog').find('.dd-input-select-chips__row').should('have.length', 3).then(rows => {
          const first = rows[0].getBoundingClientRect()
          const second = rows[1].getBoundingClientRect()
          expect(second.top).to.be.greaterThan(first.bottom)
          const buttons = rows[1].querySelectorAll('button')
          expect(buttons[1].getBoundingClientRect().top).to.be.greaterThan(buttons[0].getBoundingClientRect().top)
          expect(rows[2].querySelector('button')?.getAttribute('aria-label')).to.equal('Eigenen Wert eingeben')
        })
        cy.get('@dialog').contains('button', 'Alpha').focus()
        pressKey(' ')
        cy.get('#selection').should('have.text', '["a"]')
        cy.get('@dialog').contains('button', 'Alpha').should('have.attr', 'aria-pressed', 'true')
        cy.get('@dialog').contains('button', 'Beta').click()
        cy.get('#selection').should('have.text', '["a","b"]')
        cy.get('@dialog').contains('button', 'Alpha').click()
        cy.get('#selection').should('have.text', '["b"]')
        cy.get('@dialog').contains('button', 'EinSehrLanger').click()

        cy.get('.dd-input-select-chips__cloud').then(cloud => {
          expect(cloud[0].scrollWidth).to.be.at.most(cloud[0].clientWidth)
          const bounds = cloud[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(width)
          cloud.find('button').each((_, button) => {
            expect(button.scrollWidth).to.be.at.most(button.clientWidth)
          })
        })
        cy.get('@dialog').contains('button', 'Beta').then(button => {
          const style = getComputedStyle(button[0])
          expect(style.backgroundColor).not.to.equal(style.color)
          expect(style.backgroundColor).not.to.equal('rgba(0, 0, 0, 0)')
        })
        pressKey('Escape')
        cy.get('ion-modal:visible').should('not.exist')
        cy.get('#selection').should('contain.text', '"b"').and('contain.text', 'EinSehrLanger')
        cy.get('@trigger').should('be.focused').and('have.attr', 'aria-expanded', 'false')
        cy.get('@trigger').then(trigger => {
          expect(trigger[0].scrollWidth).to.be.at.most(trigger[0].clientWidth)
        })

        cy.get('@trigger').click()
        cy.get('ion-modal:visible').find('button[aria-label="Eigenen Wert eingeben"]').focus()
        pressKey('Enter')
        cy.get('ion-modal:visible').should('not.exist')
        cy.get('#selection').should('have.text', '[]')
        cy.get('ion-input input').should('be.focused').type('Eigener Text')
        cy.get('#selection').should('have.text', '["Eigener Text"]')
        cy.get('@trigger').find('[aria-live="polite"]').should('contain.text', 'Andere').and('not.contain.text', 'Eigener Text')
        cy.get('@trigger').click()
        cy.get('ion-modal:visible').find('.dd-input-select-chips__custom').should('not.exist')
        cy.get('ion-modal:visible').contains('button', 'Beta').click()
        cy.get('ion-input').should('not.exist')
        cy.get('#selection').should('have.text', '["b"]')
        cy.get('ion-modal:visible').find('.dd-input-select-chips__custom').should('be.visible')
        cy.get('ion-modal:visible').contains('button', 'Alpha').click()
        cy.get('#selection').should('have.text', '["b","a"]')
        cy.get('ion-modal:visible').contains('ion-button', 'Übernehmen')
          .shadow().find('button').focus()
        pressKey('Enter')
        cy.get('ion-modal:visible').should('not.exist')
        cy.get('#selection').should('have.text', '["b","a"]')
        cy.get('@trigger').should('be.focused').click()
        cy.get('ion-modal:visible').contains('button', 'Beta').click()
        cy.get('ion-modal:visible').contains('button', 'Alpha').click()
        cy.get('#selection').should('have.text', '[]')
        tapOutside(5, 5)
        cy.get('ion-modal:visible').should('not.exist')
        cy.get('@trigger').find('[aria-live="polite"]').should('have.text', 'Keine')
      })
    }
  }

  it('dismisses from every side without losing selections or activating the page underneath', () => {
    cy.viewport(1024, 812)
    cy.visit('/tests/e2e/fixtures/dodoInputSelectChips.html')
    cy.get('.dd-input-select-chips').click()
    cy.get('ion-modal:visible').contains('button', 'Alpha').click()
    cy.get('ion-modal:visible').contains('ion-button', 'Übernehmen').click()
    for (const [x, y] of [[512, 6], [512, 806], [6, 406], [1018, 406]]) {
      cy.get('#background-action').invoke('css', { left: `${x - 6}px`, top: `${y - 6}px` })
      cy.get('.dd-input-select-chips').click()
      cy.get('ion-modal:visible').contains('button', 'Alpha').should('have.attr', 'aria-pressed', 'true')
      tapOutside(x, y)
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('#selection').should('have.text', '["a"]')
      cy.get('#background-clicks').should('have.text', '0')
      cy.get('.dd-input-select-chips').should('be.focused').and('have.attr', 'aria-expanded', 'false')
    }
    // Ensure the underlying action really is clickable after the overlay closes.
    cy.get('#background-action').click()
    cy.get('#background-clicks').should('have.text', '1')
  })

  it('scrolls the chips on short screens while keeping the heading and action visible', () => {
    cy.viewport(320, 360)
    cy.visit('/tests/e2e/fixtures/dodoInputSelectChips.html')
    cy.get('.dd-input-select-chips').click()
    cy.get('.dd-input-select-chips__dialog').should('be.visible').should(dialog => {
      const bounds = dialog[0].getBoundingClientRect()
      expect(bounds.top).to.be.at.least(16)
      expect(bounds.bottom).to.be.at.most(344)
      expect(bounds.left).to.be.at.least(16)
      expect(bounds.right).to.be.at.most(304)
    })
    cy.get('.dd-input-select-chips__cloud').then(cloud => {
      expect(cloud[0].scrollHeight).to.be.greaterThan(cloud[0].clientHeight)
    }).scrollTo('bottom')
    cy.get('.dd-input-select-chips__heading').should('be.visible')
    cy.get('.dd-input-select-chips__custom').should('be.visible')
    cy.get('ion-modal:visible').contains('ion-button', 'Übernehmen').should('be.visible').click()
    cy.get('ion-modal:visible').should('not.exist')
  })
})
