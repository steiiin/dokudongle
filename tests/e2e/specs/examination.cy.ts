export {}

const pressKey = (key: 'Escape' | 'Enter' | ' ') => cy.then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyDown', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: { Escape: 27, Enter: 13, ' ': 32 }[key],
    text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined },
})).then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyUp', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: { Escape: 27, Enter: 13, ' ': 32 }[key] },
}))

const expectFocusWithin = (element: JQuery<HTMLElement>) => {
  const active = element[0].ownerDocument.activeElement
  expect(active === element[0] || element[0].contains(active)).to.equal(true)
}
const row = (id: string) => cy.get(`.examination-item[data-examination="${id}"]`)
const closeModal = () => {
  cy.get('ion-modal:visible').find('ion-header ion-button').click()
  cy.get('ion-modal:visible').should('not.exist')
}

for (const width of [320, 1024]) {
  describe(`inline examinations at ${width}px`, () => {
    beforeEach(() => {
      cy.viewport(width, 900)
      cy.visit('/tests/e2e/fixtures/examination.html')
    })

    it('shows full-width inactive activation rows without red actions or a picker', () => {
      cy.get('.add-examination').should('not.exist')
      for (const id of ['stridor', 'auscultation', 'accessoryMuscles', 'retractions', 'paradoxical', 'jugularVenousDistension', 'emphysema', 'trachealDeviation']) {
        // Native scrolling reaches IonContent's shadow scroll container.
        row(id).then(item => item[0].scrollIntoView({ block: 'center' }))
        row(id).should('be.visible').and('have.class', 'examination-inactive').and('contain.text', 'nicht untersucht')
        row(id).find('.positive-examination').should('not.exist')
      }
      cy.get('.examination-inactive').each(item => {
        expect(item[0].scrollWidth).to.be.at.most(item[0].clientWidth)
        const button = item[0].querySelector<HTMLButtonElement>('.activate-examination')!
        expect(button.disabled).to.equal(false)
        expect(button.getBoundingClientRect().height).to.be.at.least(44)
        expect(button.getBoundingClientRect().width).to.be.closeTo(item[0].getBoundingClientRect().width, 1)
      })
      if (width === 320) {
        cy.get('ion-card').first().then(card => card[0].scrollIntoView())
        cy.screenshot('inline-examinations-mobile', { capture: 'viewport' })
      }
    })

    it('activates booleans as true with Enter or Space and allows false before removal', () => {
      row('stridor').find('.activate-examination').focus()
      pressKey('Enter')
      row('stridor').find('ion-toggle').should('have.prop', 'checked', true)
      row('stridor').should(expectFocusWithin)
      row('stridor').find('ion-toggle').click().should('have.prop', 'checked', false)
      row('stridor').should('have.attr', 'data-assessed', 'true')
      row('stridor').find('.remove-examination').click()
      row('stridor').find('.activate-examination').should('be.focused')
      pressKey(' ')
      row('stridor').find('ion-toggle').should('have.prop', 'checked', true)
      cy.contains('ion-toggle', 'Atmung vorhanden?').click()
      row('stridor').should('not.exist')
      row('auscultation').should('not.exist')
      row('emphysema').should('exist')
    })

    it('opens the ECG modal on activation and keeps defaults when dismissed unchanged', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?circulation')
      row('ecg').find('.activate-examination').click()
      cy.get('ion-modal:visible').should('have.length', 1).and('contain.text', 'EKG').and(expectFocusWithin)
      closeModal()
      row('ecg').should('have.attr', 'data-assessed', 'true').and('contain.text', 'SR')
      row('ecg').find('.examination-control > ion-item').should(expectFocusWithin)
      row('ecg').find('.remove-examination').click()
      row('ecg').find('.activate-examination').click()
      cy.get('ion-modal:visible').should('contain.text', 'EKG').and(expectFocusWithin)
      cy.get('ion-modal:visible').find('ion-select').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Vorhofflimmern').click()
      closeModal()
      row('ecg').should('contain.text', 'VHF')
      row('ecg').find('.remove-examination').click()
      row('ecg').find('.activate-examination').click()
      cy.get('ion-modal:visible').should('contain.text', 'EKG')
      closeModal()
      row('ecg').should('contain.text', 'SR')
    })

    it('opens a modal with the keyboard and restores focus after Escape', () => {
      row('modal').find('.activate-examination').focus()
      pressKey('Enter')
      cy.get('ion-modal:visible').should('have.length', 1).and('contain.text', 'Examination details').and(expectFocusWithin)
      pressKey('Escape')
      cy.get('ion-modal:visible').should('not.exist')
      row('modal').should('have.attr', 'data-assessed', 'true')
      row('modal').find('.examination-control > ion-item').should(expectFocusWithin)
    })

    it('opens the select on activation and returns focus after dismissal or selection', () => {
      row('select').find('.activate-examination').focus()
      pressKey('Enter')
      cy.get('ion-popover:visible').should('have.length', 1).and('contain.text', 'Beta').and(expectFocusWithin)
      cy.get('ion-alert:visible').should('not.exist')
      pressKey('Escape')
      cy.get('ion-popover:visible').should('not.exist')
      row('select').should('have.attr', 'data-assessed', 'true')
      row('select').find('ion-select').should('have.prop', 'value', 'Alpha').and(expectFocusWithin)
      row('select').find('.remove-examination').click()
      row('select').find('.activate-examination').click()
      cy.get('ion-alert:visible').should('not.exist')
      cy.get('ion-popover:visible').contains('ion-item', 'Beta').click()
      cy.get('ion-popover:visible').should('not.exist')
      row('select').find('ion-select').should('have.prop', 'value', 'Beta').and(expectFocusWithin)
    })

    it('lets nonverbal patients have individual neurological examinations recorded', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?disability&nonverbal')
      for (const id of ['zops', 'headache', 'dizziness']) row(id).should('have.class', 'examination-inactive')
      row('neuro').find('.activate-examination').click()
      cy.get('ion-modal:visible').should('contain.text', 'Sensorik').and('contain.text', 'Sprache')
      for (const id of ['followInstructions', 'msMeningism', 'sensitivity', 'paraesthesia', 'dysarthria', 'aphasia']) {
        row(id).should('have.class', 'examination-inactive')
      }
      row('msMeningism').find('.activate-examination').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Nein').click()
      row('followInstructions').find('.activate-examination').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Eine').click()
      closeModal()
      cy.get('#report').should('contain.text', 'Anweisungen teilweise befolgt').and('contain.text', 'keine Nackensteife')
        .and('not.contain.text', 'Parästhesien').and('not.contain.text', 'Aphasie')
      cy.get('#toggle-nonverbal').click().click()
      cy.get('#report').should('contain.text', 'Anweisungen teilweise befolgt')
      row('headache').should('have.class', 'examination-inactive')
    })

    it('keeps abdominal pain visible and requires its own activation in nonverbal mode', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?exposure&nonverbal')
      row('abdominal').find('.activate-examination').click()
      row('pain').should('have.class', 'examination-inactive')
      row('pain').find('.activate-examination').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Keine').click()
      row('pain').find('ion-select').should('have.prop', 'value', 'keine')
      closeModal()
      cy.get('#report').should('contain.text', 'schmerzfrei').and('not.contain.text', 'Wasserlassen/Stuhlgang')
    })

    it('focuses intoxication text on activation and reactivation and omits an empty value', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?disability')
      for (let attempt = 0; attempt < 2; attempt++) {
        row('intoxication').find('.activate-examination').click()
        row('intoxication').find('ion-textarea, ion-input').should(expectFocusWithin)
        cy.get('#report').should('not.contain.text', 'Intox')
        row('intoxication').find('.remove-examination').click()
        row('intoxication').should('have.class', 'examination-inactive')
      }
    })
  })
}
