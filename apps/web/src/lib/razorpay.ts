// Razorpay Checkout, loaded on demand.
//
// Only the PUBLIC key id ever reaches the browser.
// The payment is verified via Razorpay's handler or webhook callback.

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void; on(event: string, cb: (r: any) => void): void };
    __PAVILION_CONFIG__?: {
      razorpayKeyId?: string;
    };
    __CLUB_CONFIG__?: {
      razorpayKeyId?: string;
      phone?: string;
      whatsapp?: string;
    };
  }
}

export function getRazorpayKeyId(): string {
  if (typeof window !== 'undefined') {
    const fromPavilion = window.__PAVILION_CONFIG__?.razorpayKeyId?.trim();
    if (
      fromPavilion &&
      fromPavilion.length > 0 &&
      !fromPavilion.includes('PLACEHOLDER') &&
      !fromPavilion.includes('UNGA_KEY') &&
      !fromPavilion.includes('PASTE_YOUR_KEY')
    ) {
      return fromPavilion;
    }

    const fromClub = window.__CLUB_CONFIG__?.razorpayKeyId?.trim();
    if (
      fromClub &&
      fromClub.length > 0 &&
      !fromClub.includes('PLACEHOLDER') &&
      !fromClub.includes('UNGA_KEY') &&
      !fromClub.includes('PASTE_YOUR_KEY')
    ) {
      return fromClub;
    }
  }

  const envKey = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  if (
    envKey &&
    envKey.length > 0 &&
    !envKey.includes('placeholder') &&
    !envKey.includes('PLACEHOLDER')
  ) {
    return envKey;
  }

  return '';
}

/**
 * Resolves the active Razorpay Key directly from the TurfOS venue engine.
 * Automatically synchronizes with TurfOS Test/Live mode toggles.
 */
export async function resolveRazorpayKeyId(): Promise<string> {
  try {
    const { getTurfOSPaymentConfig } = await import('@/lib/turfos-client');
    const turfConfig = await getTurfOSPaymentConfig();
    if (turfConfig && turfConfig.keyId) {
      return turfConfig.keyId;
    }
  } catch {
    // TurfOS offline fallback
  }

  return getRazorpayKeyId();
}

interface RazorpayOptions {
  key: string;
  order_id?: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => void;
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
      reject(
        new Error(
          'Could not load payment gateway. If you are using Brave Shields or an ad-blocker, please disable shields for checkout.razorpay.com.'
        )
      );
    };
    document.head.appendChild(el);
  });
  return loading;
}

export interface CheckoutInput {
  keyId: string;
  orderId?: string;
  amountPaise: number;
  currency: string;
  venueName: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  onSuccess: (paymentId?: string) => void;
  onDismiss: () => void;
  onFailure: (reason: string) => void;
}

export async function openCheckout(input: CheckoutInput): Promise<void> {
  await loadScript();
  if (!window.Razorpay) {
    throw new Error('The Razorpay checkout script did not load properly.');
  }

  const options: RazorpayOptions = {
    key: input.keyId,
    amount: input.amountPaise,
    currency: input.currency || 'INR',
    name: input.venueName || 'The Pavilion Club',
    description: input.description,
    prefill: input.prefill,
    theme: { color: '#c7a26a' },
    modal: { ondismiss: input.onDismiss, confirm_close: true },
    handler: (response) => {
      input.onSuccess(response?.razorpay_payment_id);
    },
  };

  // Crucial: Only attach order_id if non-empty string.
  // Passing order_id: "" causes Razorpay BAD_REQUEST_ERROR: "The order id does not exist".
  if (input.orderId && input.orderId.trim().length > 0) {
    options.order_id = input.orderId.trim();
  }

  const checkout = new window.Razorpay(options);

  checkout.on('payment.failed', (event: any) => {
    input.onFailure(event?.error?.description ?? 'The payment could not be processed.');
  });

  checkout.open();
}
