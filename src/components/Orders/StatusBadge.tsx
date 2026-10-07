import React from 'react';
import { paymentBadge, paymentStatusLabel, statusBadge, statusLabel } from '../../utils/orderStatus';

export const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${statusBadge(status)}`}>
    {statusLabel(status)}
  </span>
);

export const PaymentBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${paymentBadge(status)}`}>
    {paymentStatusLabel(status)}
  </span>
);
