/** Persisted with the booking. Credentials are NEVER stored here. */
export interface BookingPayment {
  provider: 'PAYOS';
  channelId: string;
  orderCode: number;
  expiresAt: string;
  cancelBefore: string;
  linkId?: string;
  qrCode?: string;
  checkoutUrl?: string;
  accountName?: string;
  accountNumber?: string;
  bankBin?: string;
  description?: string;
  cancelSyncPending?: boolean;
  paidAt?: string;
  /** Amount confirmed by the signed payOS payment-link response, even if its transaction list is empty. */
  providerConfirmedAmount?: number;
  exception?: string;
  receipts: { reference: string; amount: number; paidAt: string }[];
}

export interface BookingRefund {
  status: 'PENDING' | 'REFUNDED';
  amount: number;
  refundedAmount?: number;
  reference?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface BookingAudit {
  action: string;
  at: string;
  actor: string;
  note?: string;
}
