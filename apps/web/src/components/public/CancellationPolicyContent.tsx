import { ArrowLink, GoldButton, PageHero, PolicyBody, SitePage, type Clause } from '@/components/public/site/SitePage';
import { CLUB } from '@/lib/club';

/**
 * Served at both /cancellation/ and /cancellation-policy/. Shared-play sessions,
 * court bookings, Studio classes and events each have their own terms
 * (website content brief, section 4).
 */
const CLAUSES: readonly Clause[] = [
  {
    id: 'membership-sessions',
    n: 'A',
    title: 'Shared-play membership sessions',
    body: (
      <ul className="site-ticks">
        <li>Cancel at least 12 hours before the scheduled session.</li>
        <li>Cancellations made less than 12 hours before the session, and no-shows, ordinarily count as a used session.</li>
        <li>Late arrival does not extend the session.</li>
        <li>If the club cancels a confirmed session, your session balance is restored or an equivalent rescheduling option is offered.</li>
      </ul>
    ),
  },
  {
    id: 'court-bookings',
    n: 'B',
    title: 'Court bookings',
    body: (
      <ul className="site-ticks">
        <li>
          Cancel at least 12 hours before your booking, from <a href="/my-bookings/">My bookings</a> (sign in with your
          email and a one-time code) or by calling the front desk.
        </li>
        <li>Bookings made on this website are currently paid at the venue, so there is nothing to refund when you cancel.</li>
        <li>Repeated late cancellations or no-shows may limit future online bookings.</li>
        <li>If the club cancels your booking, you are offered an alternative slot or a full refund of anything you have paid.</li>
      </ul>
    ),
  },
  {
    id: 'studio',
    n: 'C',
    title: 'Pavilion Studio classes',
    body: (
      <p>
        Studio cancellation deadlines, no-show rules, waitlists and make-up classes will be published with the Studio
        timetable. The court booking policy does not automatically apply to Studio classes.
      </p>
    ),
  },
  {
    id: 'events',
    n: 'D',
    title: 'Tournaments and events',
    body: <p>Cancellation and rescheduling terms for an event are set out in its written quotation.</p>,
  },
  {
    id: 'membership-payment',
    n: 'E',
    title: 'Membership payment, renewal and refunds',
    body: (
      <ul className="site-ticks">
        <li>Payment is due in full before activation.</li>
        <li>There is no automatic renewal unless it is clearly offered and you expressly authorise it.</li>
        <li>
          Once activated, fees are generally non-refundable, except where required by law or approved by the club in
          writing. Your statutory consumer rights are not affected.
        </li>
        <li>Material changes to pricing or membership benefits are communicated before they apply to a renewal or a new purchase.</li>
      </ul>
    ),
  },
  {
    id: 'partners',
    n: 'F',
    title: 'Bookings made through partner platforms',
    body: (
      <ul className="site-ticks">
        <li>
          Bookings made through a third-party platform such as Turf Town follow that platform&apos;s cancellation,
          rescheduling and refund terms.
        </li>
        <li>
          Cancel or request a refund with the platform you paid through. The front desk cannot process refunds for
          partner platform bookings.
        </li>
      </ul>
    ),
  },
  {
    id: 'closures',
    n: 'G',
    title: 'Closures and maintenance',
    body: (
      <ul className="site-ticks">
        <li>
          If a court cannot be provided because of a power outage, a weather advisory or unscheduled maintenance, the
          front desk will contact you by phone or WhatsApp.
        </li>
        <li>You will be offered priority rescheduling to an available slot, or a full refund of anything you have paid.</li>
      </ul>
    ),
  },
  {
    id: 'refunds',
    n: 'H',
    title: 'How refunds are paid',
    body: (
      <ul className="site-ticks">
        <li>Online payments are refunded to the original payment method within 5 to 7 working days.</li>
        <li>Payments made at the front desk are refunded at the front desk once the booking reference is verified.</li>
      </ul>
    ),
  },
];

export function CancellationPolicyContent() {
  return (
    <SitePage>
      <PageHero
        eyebrow="Policies"
        lines={['Cancellation', <><em>&amp;</em> refunds.</>]}
        compact
        lede="Membership sessions, court bookings, Studio classes and events each work a little differently. Here is how cancelling and refunds work for each."
      >
        <GoldButton href="/my-bookings/">Go to My bookings</GoldButton>
        <ArrowLink href={CLUB.phoneHref}>Call the desk</ArrowLink>
      </PageHero>

      <PolicyBody
        clauses={CLAUSES}
        footer={
          <div className="site-policy__end" data-fade>
            <div>
              <h2 className="site-h3">Need to cancel or view a booking?</h2>
              <p className="mt-3 text-[0.95rem] text-[var(--soft)]">
                Sign in to My bookings with your email address and a one-time code, or call {CLUB.phoneDisplay}.
              </p>
            </div>
            <GoldButton href="/my-bookings/">Go to My bookings</GoldButton>
          </div>
        }
      />
    </SitePage>
  );
}
