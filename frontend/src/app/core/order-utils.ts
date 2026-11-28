import { Order, OrderStatus } from './models';

export function hasQr(order: Order): boolean {
  return order.status === 'paid' || (order.status === 'pending' && order.payment_method === 'counter');
}

export function statusLabel(order: Order): string {
  switch (order.status) {
    case 'pending':
      return order.payment_method === 'counter' ? 'Pay at counter' : 'Awaiting payment';
    case 'paid':
      return 'Paid';
    case 'fulfilled':
      return 'Collected';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
  }
}

export function itemsSummary(order: Order): string {
  return order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ');
}

export function statusName(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Paid';
    case 'fulfilled':
      return 'Fulfilled';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
  }
}