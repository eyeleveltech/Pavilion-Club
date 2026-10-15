// Razorpay Checkout, loaded on demand.
//
// Only the PUBLIC key id ever reaches the browser (it comes back from the
// order the server opened). Opening this widget proves nothing: the booking is
// confirmed by Razorpay's webhook reaching TurfOS, and the caller polls for
// that. `onSuccess` therefore means "start waiting", not "you are booked".

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void; on(event: string, cb: (r: any) => void): void };
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => void;
}

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SCRIPT;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      loading = null;
      reject(new Error('Could not load the payment window. Check your connection.'));
    };
    document.head.appendChild(el);
  });
  return loading;
}

export interface CheckoutInput {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  venueName: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: () => void;
  onDismiss: () => void;
  onFailure: (reason: string) => void;
}

export async function openCheckout(input: CheckoutInput): Promise<void> {
  await loadScript();
  if (!window.Razorpay) throw new Error('The payment window did not load.');

  const checkout = new window.Razorpay({
    key: input.keyId,
    order_id: input.orderId,
    amount: input.amountPaise,
    currency: input.currency,
    name: input.venueName,
    description: input.description,
    prefill: input.prefill,
    theme: { color: '#c7a26a' },
    modal: { ondismiss: input.onDismiss, confirm_close: true },
    handler: () => input.onSuccess(),
  });

  checkout.on('payment.failed', (event) => {
    input.onFailure(event?.error?.description ?? 'The payment did not go through.');
  });

  checkout.open();
}
