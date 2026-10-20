# Message to the client — hosting setup (draft)

Replace anything in `[ ]` before sending. Written for the club owner, in plain
language. The technical detail behind it is in
`docs/system/13-ops-security.md`.

---

**Subject:** Pavilion Club — hosting for the website and booking system

Hi [name],

Before the website and booking system can go live, they need a home on the
internet. This note explains what we will set up and the few things we need
from you.

**How it will work**

Everything runs on one private server rented in your name: the website, the
online booking, the front-desk screen and the booking records. Nobody else
shares it. Customers and staff reach it through your website address.

**What we need from you**

1. **A server.** A Hostinger VPS on the **KVM 1** plan, in their India
   location. That is their smallest plan and it is enough to launch with
   three courts. If bookings grow, we move up one plan from the Hostinger
   panel without rebuilding anything. Please buy it in the club's name, not
   ours, so the club owns its own data. We can sit with you while you buy
   it, or you can send us the login afterwards.
2. **A website address.** For example `pavilionclub.in`. If you already own
   one, send us access to it. If not, tell us the name you want and we will
   check that it is free. This should also be registered in the club's name.
3. **A backup account.** A small online storage account (Cloudflare R2 or
   Backblaze) where a copy of all bookings is saved every night, away from the
   server. If the server ever fails, nothing is lost.
4. **A club email address** on that website name, such as
   `bookings@[your address]`, for confirmations and for customers to reply to.
5. **One contact person and phone number.** If the site ever goes down, an
   alert goes to that phone straight away. Please tell us who that should be.

**What we take care of**

- Installing and setting up everything on the server.
- The padlock in the browser (secure connection), set up and renewed
  automatically.
- A backup every night, and a test before launch where we restore the backup
  onto a fresh server to prove it works.
- Watching the site round the clock and fixing problems when the alert comes.

**What it costs you**

Three small recurring bills, all paid by the club directly: the server, the
website address, and the backup storage. [Add current prices here.]

**One decision for you**

After launch, someone has to look after the server: updates, backups, and
being on call if something breaks. That can be us under a maintenance
arrangement, or your own IT person. Please let us know which you prefer.

**What happens next**

Once we have the server and the website address, setup takes about
[2–3 working days]. The address is the most urgent item, because several
other things depend on it.

Thanks,
[your name]
