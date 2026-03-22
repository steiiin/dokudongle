export type RedflagCategory = 'trauma' | 'neuro'
export type RedflagApplication = 'Verweigerung' | 'BvO'

export class RedflagScenario {
  constructor(
    public id: string,
    public name: string,
    public requirements: string,
    public application: RedflagApplication,
    public category: RedflagCategory,
    public majorSignals: string[],
    public minorSignals: string[],
    public consequences: string = '',
    public diagnoses: string[] = [],
  ){}
}

// ######################################################################################

export const Scenarios: Record<string, RedflagScenario> = createScenarios([

  defSc(
    'Sturz/Verletzung (leicht)', 'Keine Fehlstellung, DMS intakt',
    'BvO', 'trauma',
    [ ],
    [ ],
  ),

  defSc(
    'Platz-/Schnittwunde (leicht)', 'Blutung gestillt, DMS intakt',
    'BvO', 'trauma',
    [ ],
    [ ],
  ),



])

// ######################################################################################

export class RedflagSignal {
  constructor(
    public id: string,
    public name: string,
    public text: string,
    public category: string,
  ){}
}

// ######################################################################################

export const Signals: Record<string, RedflagSignal> = createSignals([

  defSg('Krampfanfall', 'neuro',
    'erneutem Krampfanfall'),

])

// ######################################################################################

function genKey(cat: string, name: string) { return cat + name.replace(/[\/(]/g, '_').replace(/[ \-)]/gi, '') }

function defSc(
  name: string,
  requirements: string,
  application: RedflagApplication,
  category: RedflagCategory,
  majorSignals: string[],
  minorSignals: string[],
  consequences: string = '',
  diagnoses: string[] = [],
) {
  return {
    name,
    requirements,
    application,
    category,
    majorSignals,
    minorSignals,
    consequences,
    diagnoses,
  }
}

function createScenarios(
  list: ReturnType<typeof defSc>[]
): Record<string, RedflagScenario> {
  return Object.fromEntries(
    list.map((sc) => {
      const key = genKey(sc.category, sc.name);
      return [
        key,
        new RedflagScenario(
          key,
          sc.name,
          sc.requirements,
          sc.application,
          sc.category,
          sc.majorSignals,
          sc.minorSignals,
          sc.consequences,
          sc.diagnoses
        ),
      ];
    })
  );
}

function defSg(
  name: string, category: RedflagCategory,
  text: string,
) {
  return {
    name,
    text,
    category,
  }
}

function createSignals(
  list: ReturnType<typeof defSg>[]
): Record<string, RedflagSignal> {
  return Object.fromEntries(
    list.map((sc) => {
      const key = genKey(sc.category, sc.name);
      return [
        key,
        new RedflagSignal(
          key,
          sc.name,
          sc.text,
          sc.category,
        ),
      ];
    })
  );
}
