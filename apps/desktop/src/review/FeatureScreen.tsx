// One feature (bar A.6, amb-feed 5f436473): its branch and base, how far it
// is from the trunk, its agents, its state (checked, a try building, on
// trial), and try / merge / drop through its card (no typed command:
// store.answer with the card's id, architect m_10203); the merge card's
// drop asks once more, as the TUI does. Owner: amb-win.
import { useEffect, useState } from 'react';
import { Button, Empty, Head, Row, SectionHead } from '@/ds';
import { useAgents, useCards, useFeatures, useStore } from '@/store';
import { useRouter } from '@/app/router';
import { dotOf, endOf } from '@/agents/model';
import { useNow } from '@/app/clock';
import { cardOf, choicesOf, distance, dropAsk, stateWords } from './feature';
import './review.css';

export function FeatureScreen({ project, name }: { project: string; name: string }) {
  const store = useStore();
  const router = useRouter();
  const features = useFeatures(project);
  const cards = useCards(project);
  const agents = useAgents(project);
  const now = useNow();
  const [asking, setAsking] = useState(false);

  // a fresh list on open
  useEffect(() => {
    store.command({ cmd: 'features', project });
  }, [store, project]);

  const f = features.find((x) => x.name === name);
  if (f === undefined) {
    return (
      <section className="rv-screen" data-testid="feature.screen" data-project={project} data-feature={name}>
        <Head title={`ψ ${name}`} sub="feature" />
        <div className="rv-body">
          <Empty title="no such feature">it was merged or dropped, or the list hasn't come yet</Empty>
        </div>
      </section>
    );
  }
  const card = cardOf(f, cards);
  const choices = card ? choicesOf(card, asking) : [];
  const mine = agents.filter((a) => f.agents.includes(a.name));
  return (
    <section className="rv-screen" data-testid="feature.screen" data-project={project} data-feature={name}>
      <Head title={`ψ ${f.name}`} sub={`${f.branch} → ${f.base} · ${distance(f)}`} />
      <div className="rv-body">
        <p className="rv-note" data-testid="feature.state" data-building={f.building} data-trial={f.trial} data-checked={f.checked}>
          {stateWords(f)}
          {f.adopted === true ? ' · an existing branch' : ''}
        </p>
        {f.tried != null && (
          <p className="rv-note" data-testid="feature.tried">
            tried {f.tried.sha} · run it: <code>{f.tried.run}</code>
          </p>
        )}

        {card !== undefined && (
          <div className="ft-card" data-testid={`feature.card.${String(card.id)}`} data-kind={card.kind}>
            <p className="ft-q">{asking ? dropAsk(f) : card.question}</p>
            <div className="ft-acts">
              {choices.map((c, i) => (
                <Button
                  key={c.label}
                  kind={i === 0 ? 'pri' : c.confirm || (asking && c.reply !== undefined) ? 'danger' : 'ghost'}
                  testId={c.back ? 'feature.keep' : c.confirm ? 'feature.drop' : asking ? 'feature.drop.yes' : `feature.opt.${c.reply ?? ''}`}
                  onClick={() => {
                    if (c.confirm) setAsking(true);
                    else if (c.back) setAsking(false);
                    else if (c.reply !== undefined) {
                      setAsking(false);
                      store.answer(project, card.id, c.reply);
                    }
                  }}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        {card === undefined && f.card == null && (
          <p className="rv-note" data-testid="feature.nocard">
            {f.trial ? 'on trial: main asks you to merge, keep working or drop it' : 'main asks you to try it when its agents are done'}
          </p>
        )}

        <SectionHead>agents</SectionHead>
        {mine.length === 0 && (
          <p className="rv-note" data-testid="feature.noagent">
            no agent on it now
          </p>
        )}
        {mine.map((a) => {
          const end = endOf(a, now);
          return (
            <Row
              key={a.name}
              kind="ag"
              name={a.name}
              dot={dotOf(a.status)}
              end={end.text}
              needs={end.needs}
              onClick={() => {
                router.go({ screen: 'thread', project, agent: a.name });
              }}
              testId={`feature.agent.${a.name}`}
            />
          );
        })}
      </div>
    </section>
  );
}
