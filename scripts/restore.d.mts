export interface RestoreResult {
  ok: boolean;
  verified: boolean;
  source: {
    bookingsCount: number;
    bookingAmountPaise: string;
    paymentsCount: number;
    paymentAmountPaise: string;
  };
  message: string;
}
export function runRestoreAndVerify(backupFilePath: string, options?: Record<string, unknown>): Promise<RestoreResult>;