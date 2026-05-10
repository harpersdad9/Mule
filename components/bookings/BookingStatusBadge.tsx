import React from 'react';
import { Badge } from '../ui/Badge';
import type { BookingStatus } from '../../types/app.types';

const statusConfig: Record<BookingStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending:   { label: 'Pending',   variant: 'warning' },
  accepted:  { label: 'Accepted',  variant: 'info' },
  paid:      { label: 'Paid',      variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  reviewed:  { label: 'Reviewed',  variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  disputed:  { label: 'Disputed',  variant: 'error' },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = statusConfig[status] ?? { label: status, variant: 'default' };
  return <Badge label={label} variant={variant} />;
}
