export {}

const modal = () => cy.get('ion-modal:visible')
const popover = () => cy.get('ion-popover.auscultation-popover:visible')
const finding = (key: string) => modal().find(`[data-finding="${key}"]`)
const toggleDetail = () => {
  popover().find('.localization-panel[inert]').should('not.exist')
  popover().find('[data-testid="auscultation-detail-toggle"]').click()
  popover().find('.localization-panel[inert]').should('not.exist')
}
const region = (key: string) => popover().find(`[data-region="${key}"]`)
const closed = () => {
  popover().should('not.exist')
  cy.get('ion-popover.auscultation-popover ion-content').should('not.exist')
}
const save = () => {
  popover().contains('ion-button', 'Speichern').click()
  closed()
}
const dismiss = () => {
  popover().shadow().find('ion-backdrop').click({ force: true })
  closed()
}
const chooseSide = (side: string) => {
  popover().find(`[data-side="${side}"]`).click()
  closed()
}
const openModal = () => cy.get('[data-examination="auscultation"]').contains('ion-item', 'Auskultation').click()
const closeModal = () => {
  modal().find('ion-header ion-button').click()
  modal().should('not.exist')
}
const pressKey = (key: 'Enter' | 'Escape' | ' ') => {
  const params = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: key === 'Enter' ? 13 : key === 'Escape' ? 27 : 32 }
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyDown', text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : '' },
  }))
  cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent', params: { ...params, type: 'keyUp' },
  }))
}

for (const width of [320, 1024]) {
  describe(`auscultation at ${width}px`, () => {
    beforeEach(() => {
      cy.viewport(width, 812)
      cy.visit('/tests/e2e/fixtures/examination.html')
      cy.get('[data-examination="auscultation"] .activate-examination').click({ scrollBehavior: 'center' })
      modal().find('ion-list ion-item-divider').should('contain.text', 'Lautstärke')
    })

    it('localizes, edits, cancels, removes and explicitly sets normal', () => {
      modal().find('[data-testid="auscultation-volume-normal"]').should('have.attr', 'aria-pressed', 'true')
      modal().find('[data-testid="auscultation-addedSounds-normal"]').should('have.attr', 'aria-pressed', 'true')
      finding('diminished').click()
      popover().find('.quick-sides ion-item').then(items => {
        expect([...items].map(item => item.textContent?.trim())).to.deep.equal(['Rechts', 'Links', 'Beidseits', 'Detailierter'])
      })
      popover().find('[role="separator"]').should('exist')
      popover().find('ion-button').should('not.exist')
      cy.screenshot(`auscultation-simple-${width}`, { capture: 'viewport' })
      popover().find('.lung-map').should('not.exist')
      popover().should('not.contain.text', 'Entfernen')
      toggleDetail()
      popover().find('[data-side]').should('not.exist')
      popover().find('[data-region]').should('have.length', 4)
      popover().should('contain.text', 'Patient rechts').and('contain.text', 'Patient links')
      region('right-upper').click()
      region('right-base').click()
      region('left-upper').click()
      save()
      modal().find('[data-testid="auscultation-volume-normal"]').should('have.attr', 'aria-pressed', 'false')
      modal().find('[data-testid="auscultation-addedSounds-normal"]').should('have.attr', 'aria-pressed', 'true')
      finding('diminished').should('contain.text', 'bds. Oberfeld und re. basal')
      finding('silent').click()
      toggleDetail()
      region('right-base').click()
      save()
      finding('diminished').should('contain.text', 'bds. Oberfeld').and('not.contain.text', 'basal')
      finding('wheezing').click()
      chooseSide('both')
      finding('wheezing').should('contain.text', 'ubiquitär')
      closeModal()
      cy.get('#report').should('contain.text', 'bds. Oberfeld AG abgeschwächt. Ubiquitär Giemen')
        .and('not.contain.text', 'kein AG').and('not.contain.text', 'AG normal')
      openModal()
      finding('wheezing').click()
      toggleDetail()
      region('left-base').click()
      dismiss()
      finding('wheezing').should('contain.text', 'ubiquitär')
      finding('wheezing').click()
      chooseSide('both')
      finding('wheezing').should('contain.text', 'ubiquitär')
      finding('wheezing').click()
      toggleDetail()
      for (const key of ['right-upper', 'right-base', 'left-upper', 'left-base']) {
        region(key).should('have.attr', 'aria-pressed', 'true')
      }
      region('right-base').click()
      region('left-upper').click()
      toggleDetail()
      toggleDetail()
      region('right-upper').should('have.attr', 'aria-pressed', 'true')
      region('left-base').should('have.attr', 'aria-pressed', 'true')
      save()
      finding('wheezing').should('contain.text', 're. Oberfeld und li. basal')
      finding('wheezing').click()
      region('right-upper').should('have.attr', 'aria-pressed', 'true')
      toggleDetail()
      chooseSide('left')
      finding('wheezing').should('contain.text', 'li.').and('not.contain.text', 'Oberfeld').and('not.contain.text', 'basal')
      finding('wheezing').click()
      toggleDetail()
      region('left-base').click()
      save()
      finding('wheezing').click()
      region('left-upper').click()
      save()
      finding('wheezing').should('not.have.class', 'selected')
      modal().find('[data-testid="auscultation-addedSounds-normal"]').click()
      finding('diminished').should('have.class', 'selected')
      modal().find('[data-testid="auscultation-volume-normal"]').click()
      modal().find('[data-finding].selected').should('not.exist')
      closeModal()
      cy.get('#report').should('contain.text', 'Ausk. unauffällig').and('not.contain.text', 'kein AG')
      openModal()
      modal().find('[data-testid="auscultation-volume-normal"]').click()
      modal().find('[data-testid="auscultation-addedSounds-normal"]').click()
      closeModal()
      cy.get('#report').should('not.contain.text', 'Ausk. unauffällig')
      cy.get('[data-examination="auscultation"]').should('contain.text', 'Keine Angaben')
    })

    it('groups identical locations and resolves silent conflicts in both directions', () => {
      finding('enhanced').click()
      chooseSide('right')
      finding('wheezing').click()
      chooseSide('right')
      closeModal()
      cy.get('#report').should('contain.text', 're. AG verschärft, Giemen')
      openModal()
      finding('silent').click()
      chooseSide('right')
      finding('enhanced').should('not.have.class', 'selected')
      finding('wheezing').should('not.have.class', 'selected')
      closeModal()
      cy.get('#report').should('contain.text', 're. kein AG').and('not.contain.text', 'Giemen')
      openModal()
      finding('crackles').click()
      toggleDetail()
      region('right-base').click()
      save()
      finding('silent').should('contain.text', 're. Oberfeld')
      finding('crackles').should('contain.text', 're. basal')
      closeModal()
      cy.get('#report').should('contain.text', 're. Oberfeld kein AG. re. basal RGs')
    })

    it('slides between views and makes leaving controls inert', () => {
      cy.then(() => Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia', params: { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] },
      }))
      finding('crackles').click()
      popover().find('[data-testid="auscultation-detail-toggle"]').click().then(() => {
        const leaving = Cypress.$('ion-popover .slide-forward-leave-active')
        expect(leaving).to.have.length(1)
        expect(leaving.attr('inert')).to.equal('')
        expect(leaving.attr('aria-hidden')).to.equal('true')
      })
      popover().find('.localization-panel[inert]').should('not.exist')
      popover().find('.localization-panel ion-item').first().should('contain.text', 'Einfach')
      popover().find('[data-testid="auscultation-detail-toggle"]').click()
      popover().find('.quick-sides:not([inert]) [data-testid="auscultation-detail-toggle"]')
        .click({ waitForAnimations: false })
      popover().find('.localization-panel[inert]').should('not.exist')
      region('right-base').click()
      toggleDetail()
      popover().find('[data-side]').should('have.length', 3)
      cy.then(() => Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia', params: { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] },
      }))
      toggleDetail()
      region('right-base').should('have.attr', 'aria-pressed', 'true')
      popover().find('.localization-panel').should('have.css', 'transition-duration', '0s')
      save()
      cy.then(() => Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia', params: { features: [] },
      }))
    })

    it('keeps actions reachable in a short viewport', () => {
      cy.viewport(width, 480)
      finding('crackles').click()
      toggleDetail()
      popover().shadow().find('[part="content"]').then(content => {
        const bounds = content[0].getBoundingClientRect()
        expect(bounds.top).to.be.at.least(0)
        expect(bounds.bottom).to.be.at.most(480)
      })
      region('right-base').click()
      save()
      finding('crackles').should('contain.text', 're. basal')
    })

    it('supports keyboard, dismissal, focus restoration and a bounded popover', () => {
      finding('enhanced').focus().should('be.focused')
      pressKey('Enter')
      popover().should('be.visible')
      popover().find('[data-testid="auscultation-detail-toggle"]').shadow().find('button').focus()
      pressKey('Enter')
      popover().find('.localization-panel[inert]').should('not.exist')
      popover().find('[data-testid="auscultation-detail-toggle"]').should('contain.text', 'Einfach')
        .shadow().find('button').should('be.focused')
      region('left-base').focus().should('be.focused')
      pressKey(' ')
      region('left-base').should('have.attr', 'aria-pressed', 'true')
      pressKey('Escape')
      popover().should('not.exist')
      finding('enhanced').should('be.focused').and('not.have.class', 'selected')
      pressKey('Enter')
      toggleDetail()
      region('left-base').should('have.attr', 'aria-pressed', 'false')
      region('left-base').click()
      popover().shadow().find('ion-backdrop').click({ force: true })
      popover().should('not.exist')
      finding('enhanced').should('be.focused').and('not.have.class', 'selected')
      finding('enhanced').click()
      toggleDetail()
      region('left-base').click()
      popover().shadow().find('[part="content"]').then(content => {
        const bounds = content[0].getBoundingClientRect()
        expect(bounds.left).to.be.at.least(0)
        expect(bounds.right).to.be.at.most(width)
        expect(bounds.bottom).to.be.at.most(812)
      })
      popover().find('.localization-editor').then(editor => {
        expect(editor[0].scrollWidth).to.be.at.most(editor[0].clientWidth)
      })
      cy.screenshot(`auscultation-${width}`, { capture: 'viewport' })
      save()
      finding('enhanced').should('be.focused').and('contain.text', 'li. basal')
      closeModal()
      cy.get('#report').should('contain.text', 'li. basal AG verschärft').and('not.contain.text', 'Bronchialatmen')
    })
  })
}
