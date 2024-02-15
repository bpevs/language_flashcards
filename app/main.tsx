/** @jsx jsx */
import { Hono } from 'npm:hono'
import { jsx } from 'npm:hono/jsx'
import { html } from 'npm:hono/html'
import { serveStatic } from 'npm:@hono/node-server/serve-static'

import data from './__data__/zh_CN.ts'
import fromObj from '../gen/from_obj.ts'

const app = new Hono()

app.get('/', (c) => {
  const deck = fromObj(data)
  const note = deck.notes[0]

  return c.html(
    <html>
      <language-flashcard
        id='flashcard'
        question={note.data.emoji}
        answer={note.data.text}
      />

      <script type='module'>
        {html`
        import Flashcard from './components/flashcard.js'
        customElements.define("language-flashcard", Flashcard);

        let showCard = false
        const cardEl = document.getElementById('flashcard')
        cardEl.onclick = () => {
          showCard = !showCard
          cardEl.setAttribute('show', showCard)
        }
      `}
      </script>
    </html>,
  )
})

app.use('/*', serveStatic({ root: './' }))

Deno.serve(app.fetch)
