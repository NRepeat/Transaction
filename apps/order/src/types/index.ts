import { CategoryV5, OrderSideV5, OrderTypeV5 } from 'bybit-api';

export interface ByBitRequestOrderData {
  category: CategoryV5;
  symbol: string;
  side: OrderSideV5;
  orderType: OrderTypeV5;
  qty: string;
  orderLinkId: string;
}
