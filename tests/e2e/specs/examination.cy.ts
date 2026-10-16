import type { Components } from '@ionic/core'

type ItemElement = HTMLElement & Components.IonItem

const pressKey = (key: 'Escape' | 'Enter' | 'Tab') => cy.then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyDown', key, code: key, windowsVirtualKeyCode: { Escape: 27, Enter: 13, Tab: 9 }[key],
    text: key === 'Enter' ? '\r' : undefined },
})).then(() => Cypress.automation('remote:debugger:protocol', {
  command: 'Input.dispatchKeyEvent',
  params: { type: 'keyUp', key, code: key, windowsVirtualKeyCode: { Escape: 27, Enter: 13, Tab: 9 }[key] },
}))

const pressEscape = () => pressKey('Escape')

// Wait for Ionic's presentation focus before sending native keyboard events.
const openPickerForKeyboard = (card: string) => cy.get(card).find('.add-examination').then(button =>
  new Cypress.Promise<void>(resolve => {
    button[0].ownerDocument.addEventListener('ionPopoverDidPresent', () => resolve(), { once: true })
    button[0].click()
  }),
)

const expectFocusWithin = (element: JQuery<HTMLElement>) => {
  const active = element[0].ownerDocument.activeElement
  expect(active === element[0] || element[0].contains(active)).to.equal(true)
}

const expectBreathingSeparators = (card: JQuery<HTMLElement>) => {
  const rows = card[0].querySelectorAll<HTMLElement>('.examination-item')
  rows.forEach((row, index) => {
    const separator = row.querySelector<ItemElement>('.examination-separator')
    if (row.dataset.examination === 'trachealDeviation') {
      expect(separator).to.equal(null)
      return
    }
    expect(separator, `${row.dataset.examination} separator`).not.to.equal(null)
    const style = row.ownerDocument.defaultView!.getComputedStyle(separator!)
    if (index === rows.length - 1) expect(style.display).to.equal('none')
    else expect(style.display).not.to.equal('none')
    expect(separator!.lines).to.equal(row.dataset.examination === 'auscultation' ? 'full' : 'inset')
  })
}

const expectPickerSeparators = (popover: JQuery<HTMLElement>) => {
  const options = popover[0].querySelectorAll<ItemElement>('ion-item')
  options.forEach((option, index) => {
    const separated = option.dataset.examination === 'auscultation' && index < options.length - 1
    expect(option.lines, `${option.dataset.examination} picker line`).to.equal(separated ? 'full' : 'none')
  })
}

for (const width of [320, 1024]) {
  describe(`examination picker at ${width}px`, () => {
    beforeEach(() => {
      cy.viewport(width, 900)
      cy.visit('/tests/e2e/fixtures/examination.html')
      cy.contains('ion-card', 'A - Airway').as('airway')
      cy.contains('ion-card', 'Controls').as('controls')
      cy.contains('ion-card', 'B - Breathing').as('breathing')
    })

    it('adds ECG defaults, edits through the positive action, and resets on removal', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?circulation')
      cy.contains('ion-card', 'C - Circulation').as('circulation')
      cy.get('@circulation').find('.examination-item').should('not.exist')
      openPickerForKeyboard('@circulation')
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="ecg"] .positive-examination').should('have.length', 1)
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="ecg"]')
        .shadow().find('button').focus()
      pressKey('Enter')
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@circulation').find('[data-examination="ecg"]').should('contain.text', 'SR').should(expectFocusWithin)
      cy.get('@circulation').find('[data-examination="ecg"] .remove-examination').click()
      cy.get('@circulation').find('.add-examination').should(expectFocusWithin)
      openPickerForKeyboard('@circulation')
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="ecg"]')
        .shadow().find('button').focus()
      pressKey('Tab')
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="ecg"] .positive-examination').should(expectFocusWithin)
      pressKey('Enter')
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').should('have.length', 1).should(expectFocusWithin)
      cy.get('ion-modal:visible').find('ion-toggle').should('not.exist')
      cy.get('ion-modal:visible').find('ion-select').should('have.prop', 'value', 'SR').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Vorhofflimmern').click()
      cy.get('ion-modal:visible').find('ion-header ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@circulation').find('[data-examination="ecg"]').should('contain.text', 'VHF')
      cy.get('@circulation').find('[data-examination="ecg"] .remove-examination').click()
      cy.get('@circulation').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="ecg"]').click()
      cy.get('@circulation').find('[data-examination="ecg"]').should('contain.text', 'SR')
      cy.get('ion-modal:visible').should('not.exist')
    })

    it('adds edema defaults, edits through the positive action, and resets on re-addition', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?circulation')
      cy.contains('ion-card', 'C - Circulation').as('circulation')
      const addEdema = (positive = false) => {
        openPickerForKeyboard('@circulation')
        cy.get('ion-popover.examination-picker:visible').find('[data-examination="edema"]')
          .shadow().find('button').focus()
        if (positive) {
          pressKey('Tab')
          cy.get('ion-popover.examination-picker:visible').find('[data-examination="edema"] .positive-examination')
            .should(expectFocusWithin)
        }
        pressKey('Enter')
        cy.get('ion-popover.examination-picker:visible').should('not.exist')
        if (positive) cy.get('ion-popover:visible').should('have.length', 1).should(expectFocusWithin)
        else {
          cy.get('ion-popover:visible').should('not.exist')
          cy.get('@circulation').find('[data-examination="edema"]').should(expectFocusWithin)
        }
      }
      const chooseOption = (label: string) => {
        let dismissed: Promise<void>
        cy.get('ion-popover:visible').should('have.length', 1).then(popover => {
          dismissed = new Cypress.Promise<void>(resolve => {
            popover[0].addEventListener('ionPopoverDidDismiss', () => resolve(), { once: true })
          })
        })
        cy.get('ion-popover:visible').contains('ion-item', label).click()
        cy.then(() => dismissed)
        cy.get('ion-popover:visible').should('not.exist')
      }
      addEdema()
      cy.get('@circulation').find('[data-examination="edema"] ion-select').should('have.prop', 'value', 'keine Ödeme')
      cy.get('@circulation').find('[data-examination="edema"] .remove-examination').click()
      cy.get('@circulation').find('.add-examination').should(expectFocusWithin)
      addEdema(true)
      cy.get('@circulation').find('[data-examination="edema"] ion-select').should('have.prop', 'value', 'keine Ödeme')
      chooseOption('Knöchelödeme')
      cy.get('@circulation').find('[data-examination="edema"]').contains('ion-select', 'Verlauf').click()
      chooseOption('zunehmend')
      cy.get('@circulation').find('[data-examination="edema"]').contains('ion-select', 'Ödeme').click()
      chooseOption('keine Ödeme')
      cy.get('@circulation').find('[data-examination="edema"] ion-select').should('have.length', 1)
      cy.get('@circulation').find('[data-examination="edema"] .remove-examination').click()
      cy.get('@circulation').find('.add-examination').should(expectFocusWithin)
      addEdema()
      cy.get('@circulation').find('[data-examination="edema"] ion-select').should('have.prop', 'value', 'keine Ödeme')
      cy.get('@circulation').find('[data-examination="edema"]').each(row => {
        expect(row[0].scrollWidth).to.be.at.most(row[0].clientWidth)
      })
    })

    it('adds Stridor, keeps a negative result visible, removes and re-adds it', () => {
      cy.get('@airway').find('.examination-item').should('not.exist')
      cy.get('@airway').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Stridor').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('@airway').find('[data-examination="stridor"] ion-toggle').should('have.prop', 'checked', true).click()
      cy.get('@airway').find('[data-examination="stridor"] ion-toggle').should('have.prop', 'checked', false)
      cy.get('@airway').find('[data-examination="stridor"] .examination-separator')
        .should('have.prop', 'lines', 'inset').and('not.have.css', 'display', 'none')
      cy.get('@airway').find('.add-examination').should('have.prop', 'disabled', true)
      cy.get('@airway').find('.remove-examination').click()
      cy.get('@airway').find('.examination-item').should('not.exist')
      cy.get('@airway').find('.add-examination').should(expectFocusWithin)
      cy.get('@airway').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Stridor').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('@airway').find('[data-examination="stridor"] ion-toggle').should('have.prop', 'checked', true)
      cy.get('@airway').contains('ion-toggle', 'Atmung vorhanden?').click()
      cy.get('@airway').find('.examination-item').should('not.exist')
      cy.get('@airway').find('.add-examination').should('have.prop', 'disabled', true)
    })

    it('adds, edits and removes breathing examinations with correct availability', () => {
      const add = (label: string) => {
        cy.get('@breathing').find('.add-examination').click()
        cy.get('ion-popover.examination-picker:visible').should(expectPickerSeparators)
        const row = cy.get('ion-popover.examination-picker:visible').contains('ion-item', label)
        if (label === 'Auskultation') row.find('.positive-examination').click()
        else row.click()
        cy.get('ion-popover.examination-picker:visible').should('not.exist')
        if (label !== 'Auskultation') cy.get('@breathing').contains('.examination-item', `${label}?`).should(expectFocusWithin)
      }
      cy.get('@breathing').should('not.contain.text', 'Thoraxbefunde')
      cy.get('@breathing').find('.examination-item').should('not.exist')
      add('Auskultation')
      cy.get('ion-modal:visible').should('have.length', 1).and('contain.text', 'Giemen/Brummen')
      cy.get('ion-modal:visible').should('not.contain.text', 'Abgehört?').should(expectFocusWithin)
      cy.get('ion-modal:visible').contains('ion-select', 'Rasselgeräusche').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Beidseits').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('ion-modal:visible').find('ion-header ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@breathing').find('[data-examination="auscultation"]').should('contain.text', 'RGs bds')
      cy.get('@breathing').should(expectBreathingSeparators)
      cy.get('@breathing').find('[data-examination="auscultation"] .remove-examination').click()
      cy.get('@breathing').find('.add-examination').should(expectFocusWithin)
      add('Auskultation')
      cy.get('ion-modal:visible').contains('ion-select', 'Rasselgeräusche').should('have.prop', 'value', '')
      cy.get('ion-modal:visible').find('ion-header ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')

      for (const [id, label] of [
        ['accessoryMuscles', 'Hilfsmuskulatur'], ['retractions', 'Einziehungen'],
        ['paradoxical', 'Paradoxe Atmung'], ['jugularVenousDistension', 'Halsvenenstauung'],
        ['emphysema', 'Subkutanes Emphysem'], ['trachealDeviation', 'Trachealverschiebung'],
      ]) {
        add(label)
        cy.get('@breathing').should(expectBreathingSeparators)
        cy.get('@breathing').find(`[data-examination="${id}"] ion-toggle`).should('have.prop', 'checked', true).click()
        cy.get('@breathing').find(`[data-examination="${id}"] ion-toggle`).should('have.prop', 'checked', false)
        cy.get('@breathing').find(`[data-examination="${id}"] .remove-examination`).click()
        cy.get('@breathing').should(expectBreathingSeparators)
        cy.get('@breathing').find('.add-examination').should(expectFocusWithin)
        add(label)
        cy.get('@breathing').find(`[data-examination="${id}"] ion-toggle`).should('have.prop', 'checked', true)
      }
      cy.get('@breathing').find('.add-examination').should('have.prop', 'disabled', true)
      cy.get('@breathing').find('.examination-item').each(row => {
        expect(row[0].scrollWidth).to.be.at.most(row[0].clientWidth)
      })
      cy.get('@breathing').find('[data-examination="auscultation"] .remove-examination').click()
      cy.get('@breathing').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').find('ion-item').should('have.length', 1)
        .and('contain.text', 'Auskultation').and('have.prop', 'lines', 'none')
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Auskultation').find('.positive-examination').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').find('ion-header ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@airway').contains('ion-toggle', 'Atmung vorhanden?').click()
      cy.get('@breathing').find('.examination-item').should('not.exist')
      cy.get('@breathing').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').find('ion-item').should('have.length', 3)
      cy.get('ion-popover.examination-picker:visible').should('not.contain.text', 'Auskultation')
      cy.get('ion-popover.examination-picker:visible').should(expectPickerSeparators)
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Subkutanes Emphysem').click()
      cy.get('@breathing').find('[data-examination="emphysema"] ion-toggle').should('have.prop', 'checked', true)
    })

    it('adds default auscultation by keyboard and offers an independent create action', () => {
      openPickerForKeyboard('@breathing')
      cy.get('ion-popover.examination-picker:visible').find('.positive-examination').should('have.length', 1)
        .and('have.attr', 'slot', 'end').and('have.attr', 'color', 'danger')
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="auscultation"]')
        .shadow().find('button').focus().should('be.focused')
      pressKey('Enter')
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@breathing').find('[data-examination="auscultation"]').should('contain.text', 'unauffällig')
        .should(expectFocusWithin)
      cy.get('@breathing').find('[data-examination="auscultation"] .examination-control ion-item').click()
      cy.get('ion-modal:visible').should('have.length', 1)
      cy.get('ion-modal:visible').contains('ion-select', 'Rasselgeräusche').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Beidseits').click()
      cy.get('ion-modal:visible').find('ion-header ion-button').click()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@breathing').find('[data-examination="auscultation"] .remove-examination').click()
      openPickerForKeyboard('@breathing')
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="auscultation"]')
        .shadow().find('button').focus().should('be.focused')
      pressKey('Tab')
      cy.get('ion-popover.examination-picker:visible').find('.positive-examination').should(expectFocusWithin)
      pressKey('Enter')
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').should('have.length', 1).should(expectFocusWithin)
      cy.get('ion-modal:visible').contains('ion-select', 'Rasselgeräusche').should('have.prop', 'value', '')
    })

    it('keeps preset modal/select defaults closed and editable', () => {
      cy.visit('/tests/e2e/fixtures/examination.html?presets')
      cy.contains('ion-card', 'Controls').as('controls')
      for (const id of ['modal', 'select']) {
        cy.get('@controls').find('.add-examination').click()
        cy.get('ion-popover.examination-picker:visible').find(`[data-examination="${id}"]`).click()
        cy.get('ion-popover:visible').should('not.exist')
        cy.get('ion-modal:visible').should('not.exist')
        cy.get('@controls').find(`[data-examination="${id}"]`).should(expectFocusWithin)
      }
      cy.get('@controls').find('ion-select').should('have.prop', 'value', 'Alpha').click()
      cy.get('ion-popover:visible').contains('ion-item', 'Beta').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('@controls').find('ion-select').should('have.prop', 'value', 'Beta')
      cy.get('@controls').find('[data-examination="select"] .remove-examination').click()
      cy.get('@controls').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').find('[data-examination="select"] .positive-examination').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-popover:visible').should('have.length', 1).and('contain.text', 'Beta')
      cy.get('@controls').find('ion-select').should('have.prop', 'value', 'Alpha')
      pressEscape()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('@controls').find('[data-examination="modal"] .examination-control ion-item').click()
      cy.get('ion-modal:visible').should('have.length', 1)
      pressEscape()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('.examination-item').each(row => {
        expect(row[0].scrollWidth).to.be.at.most(row[0].clientWidth)
      })
    })

    it('cancels the picker, then opens modal and select after dismissal with usable focus', () => {
      cy.get('@controls').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').should('contain.text', 'Modal examination')
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@controls').find('.add-examination').then(button => {
        const anchor = button[0].getBoundingClientRect()
        cy.get('ion-popover.examination-picker:visible').shadow().find('[part="content"]').should(content => {
          const bounds = content[0].getBoundingClientRect()
          expect(bounds.left).to.be.at.least(0)
          expect(bounds.right).to.be.at.most(width)
          expect(bounds.left).to.be.lessThan(anchor.right)
          expect(bounds.right).to.be.greaterThan(anchor.left)
          expect(bounds.top).to.be.at.least(anchor.bottom - 2)
        })
      })
      pressEscape()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('@controls').find('.examination-item').should('not.exist')
      cy.get('@controls').find('.add-examination').should(expectFocusWithin).click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Modal examination').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-modal:visible').should('have.length', 1).and('contain.text', 'Examination details')
      cy.get('ion-modal:visible').should(expectFocusWithin)
      pressEscape()
      cy.get('ion-modal:visible').should('not.exist')
      cy.get('@controls').find('[data-examination="modal"] ion-item').should(expectFocusWithin)
      cy.get('@controls').find('.add-examination').click()
      cy.get('ion-popover.examination-picker:visible').contains('ion-item', 'Select examination').click()
      cy.get('ion-popover.examination-picker:visible').should('not.exist')
      cy.get('ion-popover:visible').should('have.length', 1).and('contain.text', 'Beta')
      cy.get('ion-alert:visible').should('not.exist')
      cy.get('ion-popover:visible').shadow().find('[part="content"]').then(content => {
        cy.get('@controls').find('ion-select').shadow().find('[part="container"]').then(select => {
          const anchor = select[0].getBoundingClientRect()
          const bounds = content[0].getBoundingClientRect()
          expect(bounds.left).to.be.lessThan(anchor.right)
          expect(bounds.right).to.be.greaterThan(anchor.left)
          expect(bounds.top).to.be.at.least(anchor.bottom - 2)
        })
      })
      cy.get('ion-popover:visible').contains('ion-item', 'Beta').click()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('@controls').find('ion-select').should('have.prop', 'value', 'Beta').should(expectFocusWithin)
      cy.get('@controls').find('ion-select').click()
      cy.get('ion-popover:visible').should('be.visible')
      pressEscape()
      cy.get('ion-popover:visible').should('not.exist')
      cy.get('@controls').find('ion-select').should(expectFocusWithin)
      cy.get('.examination-item').each(row => {
        expect(row[0].scrollWidth).to.be.at.most(row[0].clientWidth)
      })
    })
  })
}
