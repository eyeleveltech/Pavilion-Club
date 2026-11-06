import type { Metadata } from 'next';

import { ArrowLink, FaqList, Heading, PageHero, SitePage, type FaqItem } from '@/components/public/site/SitePage';
import { CLUB, whatsappUrl } from '@/lib/club';

export const metadata: Metadata = {
  title: 'FAQs',
  description:
    'Answers about Pavilion Courts memberships, Pavilion Studio, the Pickleball Academy, events and visiting The Pavilion Club in Mogappair East, Chennai.',
};

const GROUPS: readonly { id: string; title: string; items: readonly FaqItem[] }[] = [
  {
    id: 'memberships',
    title: 'Memberships',
    items: [
      {
        q: 'Can I book a private court through a shared-play membership?',
        a: 'No. The inaugural membership is for shared play and does not reserve a private or exclusive court.',
      },
      {
        q: 'How many sessions are included?',
        a: 'Up to 20 one-hour sessions per membership month, with a maximum of one session per day during the weekday access window (Monday – Friday, 6:00 AM – 3:00 PM).',
      },
      {
        q: 'Can I request a preferred time or skill group?',
        a: 'Bookings are subject to availability. The club will try to group players by approximate skill level, but exact matching and preferred times cannot be guaranteed.',
      },
      {
        q: 'What if the club cancels a confirmed membership session?',
        a: 'The session is restored to your available balance, or an equivalent rescheduling option is offered.',
      },
    ],
  },
  {
    id: 'studio',
    title: 'Pavilion Studio',
    items: [
      {
        q: 'Can I book dance, dance fitness, fitness, wellness or sports & movement online?',
        a: 'Not yet. The website will show the Studio timetable and how to book once programmes, class sizes, membership plans and cancellation rules are finalised.',
      },
    ],
  },
  {
    id: 'academy',
    title: 'Pickleball Academy',
    items: [
      {
        q: 'Is coaching included in the Pavilion Courts membership?',
        a: 'No. Coaching and Academy programmes are separate from the shared-play membership.',
      },
      {
        q: 'How do I find the right programme?',
        a: (
          <>
            Send an enquiry from the <a href="/academy/#enquire">Academy page</a> with your experience level and
            preferred timing, and the team will suggest the right option.
          </>
        ),
      },
    ],
  },
  {
    id: 'events',
    title: 'Events',
    items: [
      {
        q: 'Can I host a tournament, birthday party or exhibition?',
        a: (
          <>
            Yes, subject to venue suitability, availability and confirmation. Send an{' '}
            <a href="/events/#enquire">event enquiry</a> so the team can propose a suitable package.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <SitePage>
      <PageHero
        eyebrow="FAQs"
        lines={['Questions,', <em>answered.</em>]}
        tag="Memberships · Studio · Academy · Events"
        lede="If your question is not here, the front desk is happy to help."
        image="/assets/images/reception.jpg"
        side="The front desk, from 06:00 AM"
      >
        <ArrowLink href={whatsappUrl('Hi Pavilion Club! I have a question.')}>Ask on WhatsApp</ArrowLink>
        <ArrowLink href={CLUB.phoneHref}>Call the desk</ArrowLink>
      </PageHero>

      <section className="site-section site-light site-lines">
        <div className="site-wrap site-policy">
          <nav className="site-policy__toc" aria-label="Topics" data-fade>
            <p className="site-eyebrow">Topics</p>
            <ol>
              {GROUPS.map((group, i) => (
                <li key={group.id}>
                  <a href={`#${group.id}`}>
                    <span>0{i + 1}</span>
                    {group.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="grid gap-[clamp(4rem,8vw,7rem)]">
            {GROUPS.map((group, i) => (
              <div key={group.id} id={group.id} className="scroll-mt-24">
                <p className="site-eyebrow" data-fade>
                  0{i + 1}
                </p>
                <Heading as="h2" lines={[group.title]} className="site-h2--s mt-5 mb-10" />
                <FaqList items={group.items} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePage>
  );
}
