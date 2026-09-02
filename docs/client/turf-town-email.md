# Email to Turf Town — draft

Replace anything in `[ ]` before sending. Keep it this short; a partnerships
person answers five questions, not twelve. The remaining questions in
`docs/system/15-open-questions.md` can be picked up on a follow-up call.

---

**Subject:** Pavilion Club — venue listing and booking integration

Hi [name],

We're building the booking and management system for **Pavilion Club**, a
pickleball venue in [city]. They'd like to list on Turf Town, and we'd like the
two systems to talk to each other so the availability your users see is always
accurate.

One question first, because it decides everything else:

**Can a venue list on Turf Town while running its own booking software, rather
than Venue Manager?** If yes, we'd like to integrate properly. If not, better we
know now.

Assuming yes, six things we need to understand:

1. **Do you have an integration specification for third-party venue systems?**
   If so, please send it — we'd rather build to yours than ask you to build to
   ours.

2. **At checkout, does your app read venue availability live, or from a cache
   you refresh periodically?**

3. **Can you reserve a slot with us *before* charging the customer, and confirm
   after payment?** This is the only way to be certain you never sell a slot that
   has just gone at the venue's front desk.

4. **Commercials.** Your terms mention a service fee charged to the customer. Is
   there also a venue-side commission? Is it deducted before payout, and what is
   the payout cycle to the venue?

5. **Do you pass the venue the customer's name and phone number?** The front desk
   needs to identify who is arriving.

6. **Cancellations.** When a customer cancels in your app, can you notify us so
   the court is released for resale? And would you want a notification from us if
   the venue has to cancel — maintenance or weather — so you can refund the
   customer?

Two small ones:

- Is there a sandbox we can test against before going live?
- Which entity should the venue agreement be with — Turf Town Technologies
  Private Limited, or Turftown Sporting Pursuits Private Limited?

Happy to get on a call if that is quicker.

Thanks,
[your name]
[company] · [phone]

---

## Notes for the sender

- **Question 3 is the important one.** If they say no, we still integrate — we
  just accept a direct confirm and they occasionally get a `slot taken` reply.
  See `docs/system/15-open-questions.md` Q2.
- **Do not ask them to change their cancellation policy.** The client has decided
  Pavilion Club absorbs late partner cancellations. If they volunteer a
  configurable cancellation window, take it.
- **Nothing in our build waits on this reply.** Say so if they ask for time — it
  keeps the relationship easy.
