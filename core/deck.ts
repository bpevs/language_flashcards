import Card from './card.ts'
import Note, { NoteContent } from './note.ts'
import Template, { TemplateType } from './template.ts'

// deno-lint-ignore no-explicit-any
type S = Record<PropertyKey, any>

interface Scheduler {
  name: string
  init(s: S): S
  filter(s: S): boolean
  sort(sA: S, sB: S): number
  update(s: S, quality: number): S
}

/**
 * A `Deck` represents a collection of notes.
 */
export default class Deck {
  id: string
  idNum: number // For exports that use id number (Anki)
  name = ''
  desc = ''
  fields: string[] = [] // Names of different content fields
  watch: string[] = [] // Names of fields that are watched for updates
  notes: Record<string, Note> = {}
  meta: Record<string, string> = {}
  scheduler?: Scheduler
  templates: Record<string, Template> = {}

  constructor(id: string, props: {
    idNum?: number
    name?: string
    desc?: string
    fields?: string[]
    watch?: string[]
    notes?: Record<string, Note>
    meta?: Record<string, string>
    scheduler?: Scheduler
  }) {
    this.id = id
    this.idNum = props.idNum || encode(id)
    if (props.name) this.name = props.name
    if (props.notes) this.notes = props.notes
    if (props.fields) this.fields = props.fields
    if (props.watch) this.watch = props.watch
    if (props.scheduler) this.scheduler = props.scheduler
    if (props.desc) this.desc = props.desc
    if (props.meta) this.meta = props.meta
  }

  addNote(id: string, content: NoteContent, templates?: Template[]): void {
    const note = new Note(id, content, templates)
    const deckFields = this.fields
    const noteFields = Object.keys(note.content)
    const uniqueToDeck = deckFields.filter((f) => !noteFields.includes(f))
    const uniqueToNote = noteFields.filter((f) => !deckFields.includes(f))

    if (uniqueToDeck.length) {
      throw new Error(`Note is missing fields req by deck: ${uniqueToDeck}`)
    } else if (uniqueToNote.length) {
      throw new Error(`Deck is missing fields req by note: ${uniqueToNote}`)
    }

    this.notes[note.id] = note
  }

  addTemplate(
    id: string,
    q: string,
    a: string,
    type?: TemplateType,
    style?: string,
  ): void {
    this.templates[id] = new Template(id, q, a, type, style)
  }

  getCards(): Card[] {
    if (!this.scheduler) return []
    const { init, sort, name } = this.scheduler
    return Object.values(this.notes)
      .map((note) => note.getCards(this.templates))
      .flat()
      .toSorted((cardA: Card, cardB: Card) =>
        sort(
          init(cardA.scheduling[name]),
          init(cardB.scheduling[name]),
        )
      )
  }

  getNext(numCards = 1): Card[] | Card | void {
    if (!this.scheduler) return
    const { init, filter, name } = this.scheduler
    const cards = this.getCards().filter((card: Card) => {
      return filter(init(card.scheduling[name]))
    }).slice(0, numCards)
    return numCards > 1 ? cards : cards[0]
  }

  getNotes(): Note[] {
    return Object.values(this.notes)
  }

  getTemplates(): Template[] {
    return Object.values(this.templates) || []
  }

  answerNext(quality: number): void {
    const currCard = this.getNext()
    if (currCard instanceof Card) currCard.answer(this, quality)
  }
}

function encode(str: string): number {
  let num = ''
  for (let i = 0; i < str.length; i++) {
    num = num + String(str.charCodeAt(i))
  }
  return parseInt(num.slice(0, 10))
}
