export {}

const row = (id: string) => cy.get(`.examination-item[data-examination="${id}"]`)
const clickRowControl = (id: string, selector: string) => row(id).find(selector)
  .then(elements => elements[0].scrollIntoView({ block: 'center' }))
  .click({ scrollBehavior: false })
const closeModal = () => {
  cy.get('ion-modal:visible ion-header ion-button').click()
  cy.get('ion-modal:visible').should('not.exist')
}

// Check rendered geometry: text existence alone missed controls with zero width.
const expectRowLayout = (elements: JQuery<HTMLElement>) => {
  const item = elements[0]
  const content = item.querySelector<HTMLElement>(':scope > .examination-control, :scope > .activate-examination')!
  const action = item.querySelector<HTMLElement>(':scope > .remove-examination')
  const separator = item.querySelector<HTMLElement>(':scope > .examination-separator')
  const bounds = item.getBoundingClientRect()
  const controlBounds = content.getBoundingClientRect()
  const actionBounds = action?.getBoundingClientRect()
  const separatorBounds = separator?.getClientRects().length ? separator.getBoundingClientRect() : undefined
  const style = (element: Element) => item.ownerDocument.defaultView!.getComputedStyle(element)

  expect(controlBounds.width, 'visible control width').to.be.greaterThan(0)
  expect(controlBounds.left, 'control starts at row edge').to.be.closeTo(bounds.left, 1)
  expect(controlBounds.right, 'control fills available width').to.be.closeTo(actionBounds?.left ?? bounds.right, 1)
  expect(item.scrollWidth, 'row overflow').to.be.at.most(Math.ceil(bounds.width))
  expect(content.scrollWidth, 'control overflow').to.be.at.most(Math.ceil(controlBounds.width))
  expect(bounds.height, 'no extra blank row space').to.be.closeTo(
    Math.max(controlBounds.height, actionBounds?.height ?? 0) + (separatorBounds?.height ?? 0), 1,
  )
  if (actionBounds) {
    expect(actionBounds.width, 'action touch width').to.be.at.least(44)
    expect(actionBounds.height, 'action touch height').to.be.at.least(44)
    expect(actionBounds.right, 'action stays inside row').to.be.closeTo(bounds.right, 1)
  }
  if (separatorBounds) {
    expect(separatorBounds.top, 'separator below content').to.be.at.least(controlBounds.bottom - 1)
    expect(separatorBounds.height, 'separator is only a line').to.be.at.most(1)
    expect(separatorBounds.width, 'separator spans row').to.be.closeTo(bounds.width, 1)
  }
  if (content.matches('.activate-examination')) {
    expect(item.querySelector('.positive-examination'), 'no separate edit button').to.equal(null)
    expect(action, 'inactive row has no remove button').to.equal(null)
    expect(controlBounds.height, 'activation touch height').to.be.at.least(44)
    expect(style(content).fontSize, 'Ionic label size').to.equal(style(item.ownerDocument.documentElement).fontSize)
    for (const label of Array.from(content.children)) {
      const labelBounds = label.getBoundingClientRect()
      expect(labelBounds.left, 'label left padding').to.be.at.least(controlBounds.left + 15)
      expect(labelBounds.right, 'label right padding').to.be.at.most(controlBounds.right - 15)
    }
  } else {
    for (const control of Array.from(content.querySelectorAll(':scope > ion-item'))) {
      // Only the wrapper draws the boundary; dialog contents keep their own lines.
      expect(control.shadowRoot, 'hydrated Ionic control').not.to.equal(null)
      for (const part of ['.item-native', '.item-inner']) {
        expect(style(control.shadowRoot!.querySelector(part)!).borderBottomWidth, 'no duplicate border').to.equal('0px')
      }
    }
  }
}

for (const mode of ['md', 'ios']) {
  for (const width of [320, 390, 1024]) {
    describe(`examination layout in ${mode} at ${width}px`, () => {
      beforeEach(() => {
        cy.viewport(width, 900)
        cy.visit(`/tests/e2e/fixtures/examination.html?all&mode=${mode}`)
        cy.get('ion-app').should('have.class', mode)
        cy.get('ion-card-content.card-in-card').should('exist')
      })

      it('fills non-removable rows with visible, compact controls', () => {
        for (const id of ['breathlessness', 'chest', 'zops', 'headache', 'dizziness', 'nausea']) {
          row(id).should('have.attr', 'data-assessed', 'true')
          row(id).children('.remove-examination').should('not.exist')
          row(id).should(expectRowLayout).and(elements => {
            expect(elements[0].clientHeight, `${id} single-line height`).to.be.at.most(60)
          })
        }
      })

      it('keeps inactive labels and removable controls aligned through state changes', () => {
        for (const id of ['stridor', 'auscultation', 'emphysema', 'trachealDeviation', 'intoxication']) {
          row(id).should('have.class', 'examination-inactive').and(expectRowLayout)
        }
        clickRowControl('stridor', '.activate-examination')
        row('stridor').should('have.attr', 'data-assessed', 'true').and(expectRowLayout)
        clickRowControl('stridor', '.remove-examination')
        row('stridor').should('have.class', 'examination-inactive').and(expectRowLayout)
        row('stridor').find('.activate-examination').should('be.focused')

        cy.get('#toggle-nonverbal').then(elements => elements[0].scrollIntoView()).click({ scrollBehavior: false })
        row('chest').should('have.class', 'examination-inactive').and(expectRowLayout)
        clickRowControl('chest', '.activate-examination')
        cy.get('ion-modal:visible').should('contain.text', 'Brustschmerz')
        closeModal()
        row('chest').children('.remove-examination').should('exist')
        row('chest').should(expectRowLayout)
      })

      it('lays out nested examinations without removing dialog separators', () => {
        clickRowControl('neuro', '.activate-examination')
        cy.get('ion-modal:visible').should('contain.text', 'Sensorik')
        for (const id of ['followInstructions', 'msMeningism', 'sensitivity', 'paraesthesia', 'dysarthria', 'aphasia']) {
          row(id).should('have.attr', 'data-assessed', 'true').and(expectRowLayout)
        }
        cy.contains('ion-modal:visible ion-select', 'Fazialisparese').closest('ion-item').should(elements => {
          const native = elements[0].shadowRoot!.querySelector('.item-native')!
          const style = native.ownerDocument.defaultView!.getComputedStyle(native)
          expect(parseFloat(style.borderBottomWidth), 'dialog section border').to.be.greaterThan(0)
        })
        closeModal()
        clickRowControl('abdominal', '.activate-examination')
        row('pain').should('have.attr', 'data-assessed', 'true').and(expectRowLayout)
        closeModal()

        cy.get('#toggle-nonverbal').then(elements => elements[0].scrollIntoView()).click({ scrollBehavior: false })
        clickRowControl('neuro', '.examination-control > ion-item')
        row('sensitivity').should('have.class', 'examination-inactive').and(expectRowLayout)
        clickRowControl('sensitivity', '.activate-examination')
        row('sensitivity').should('have.attr', 'data-assessed', 'true').and(expectRowLayout)
        row('sensitivity').find('input, textarea').should('be.visible')
        clickRowControl('sensitivity', '.remove-examination')
        row('sensitivity').should('have.class', 'examination-inactive').and(expectRowLayout)
      })
    })
  }
}
