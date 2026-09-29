import { ChevronDown } from 'lucide-react'
import { faqs } from '../data/landing'
import { Reveal } from './Reveal'

export function Faq() {
  return (
    <section id="faq" className="section section-soft" aria-labelledby="faq-title">
      <div className="container faq-layout">
        <Reveal className="section-heading section-heading-left">
          <p className="kicker">Perguntas frequentes</p>
          <h2 id="faq-title">Antes de criar seu perfil.</h2>
          <p>O essencial para entender como a primeira conexão acontece na Altura.</p>
        </Reveal>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <Reveal delay={index * 60} key={faq.question}>
              <details>
                <summary>{faq.question}<ChevronDown aria-hidden="true" /></summary>
                <p>{faq.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
