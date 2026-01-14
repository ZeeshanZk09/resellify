"use client";

import { Eye, Filter, RefreshCcw, Search, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  OrderStatus as OrderStatusConst,
  PaymentMethod as PaymentMethodConst,
  PaymentStatus as PaymentStatusConst,
} from "@/shared/lib/generated/prisma/enums";
import type {
  OrderStatus as OrderStatusType,
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
} from "@/shared/lib/generated/prisma/enums";

type OrderStatusFilter = "all" | OrderStatusType;
type PaymentStatusFilter = "all" | PaymentStatusType;
type PaymentMethodFilter = "all" | PaymentMethodType;

type AdminOrderUser = {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
};

type AdminOrderAddress = {
  id: string;
  fullName: string | null;
  phoneNumber?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode?: string | null;
  streetAddress?: string | null;
};

type AdminOrderItemSummary = {
  id: string;
  quantity: number;
  title?: string;
  product?: {
    id: string;
    title: string;
    images: Array<{
      id: string;
      path: string;
      altText: string | null;
    }>;
  } | null;
  price: number;
  lineTotal: number;
  variant: {
    title: string;
  };
};

type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  paymentMethod: PaymentMethodType;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  placedAt: string | null;
  user: AdminOrderUser | null;
  address: AdminOrderAddress | null;
  items: AdminOrderItemSummary[];
};

type PaginatedOrders = {
  orders: AdminOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
};

type AdminOrderItemDetail = {
  id: string;
  quantity: number;
  price: number;
  lineTotal: number;
  title: string;
  product: {
    id: string;
    title: string;
    images: Array<{
      id: string;
      path: string;
      altText: string | null;
    }>;
  };
  variant: {
    id: string;
    title: string;
  } | null;
};

type AdminOrderLog = {
  id: string;
  message: string;
  fromStatus?: OrderStatusType | null;
  toStatus?: OrderStatusType | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type AdminOrderPayment = {
  id: string;
  provider: string;
  providerTxId: string | null;
  method: PaymentMethodType;
  amount: number;
  status: PaymentStatusType;
  createdAt: string;
};

type AdminOrderDetail = AdminOrderSummary & {
  items: AdminOrderItemDetail[];
  logs: AdminOrderLog[];
  payment: AdminOrderPayment | null;
};

export default function AdminOrdersPage() {
  const [ordersState, setOrdersState] = useState<PaginatedOrders>({
    orders: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(ordersState.total / ordersState.pageSize)),
    [ordersState.total, ordersState.pageSize]
  );

  const loadOrders = useCallback(
    async (page?: number) => {
      try {
        setLoadingOrders(true);
        const params = new URLSearchParams();
        if (search.trim()) {
          params.set("search", search.trim());
        }
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (paymentStatusFilter !== "all") {
          params.set("paymentStatus", paymentStatusFilter);
        }
        if (paymentMethodFilter !== "all") {
          params.set("paymentMethod", paymentMethodFilter);
        }
        if (fromDate) {
          params.set("from", fromDate);
        }
        if (toDate) {
          params.set("to", toDate);
        }
        params.set("page", String(page ?? ordersState.page));
        params.set("pageSize", String(ordersState.pageSize));

        const res = await fetch(`/api/admin/orders?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.message || "Failed to load orders");
          return;
        }
        const data = (await res.json()) as PaginatedOrders;
        setOrdersState({
          orders: data.orders || [],
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.pageSize || ordersState.pageSize,
        });
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoadingOrders(false);
      }
    },
    [
      search,
      statusFilter,
      paymentStatusFilter,
      paymentMethodFilter,
      fromDate,
      toDate,
      ordersState.page,
      ordersState.pageSize,
    ]
  );

  const loadOrderDetail = useCallback(async (orderId: string) => {
    try {
      setLoadingDetail(true);
      setSelectedOrderId(orderId);
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to load order details");
        return;
      }
      const data = (await res.json()) as { order: AdminOrderDetail };
      setSelectedOrder(data.order);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleUpdateOrder = useCallback(
    async (
      orderId: string,
      payload: {
        status?: OrderStatusType;
        paymentStatus?: PaymentStatusType;
        notes?: string;
      }
    ) => {
      try {
        setUpdatingOrderId(orderId);
        const res = await fetch("/api/admin/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            ...payload,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.message || "Failed to update order");
          return;
        }
        const updated = (await res.json()) as AdminOrderDetail;
        setOrdersState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: updated.status,
                  paymentStatus: updated.paymentStatus,
                  notes: updated.notes,
                }
              : o
          ),
        }));
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? { ...prev, ...updated } : prev
        );
        toast.success("Order updated");
      } catch {
        toast.error("Failed to update order");
      } finally {
        setUpdatingOrderId(null);
      }
    },
    []
  );

  useEffect(() => {
    void loadOrders(1);
  }, [loadOrders]);

  return (
    <section className="py-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl text-slate-700">
            Manage <span className="font-semibold text-slate-900">Orders</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, filter, and update customer orders.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadOrders(ordersState.page)}
          disabled={loadingOrders}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Orders list
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-1.5">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Order #, name, email"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as OrderStatusFilter)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Object.values(OrderStatusConst).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment status</Label>
                <Select
                  value={paymentStatusFilter}
                  onValueChange={(value) =>
                    setPaymentStatusFilter(value as PaymentStatusFilter)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Object.values(PaymentStatusConst).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select
                  value={paymentMethodFilter}
                  onValueChange={(value) =>
                    setPaymentMethodFilter(value as PaymentMethodFilter)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Object.values(PaymentMethodConst).map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label>From date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Showing {ordersState.orders.length} of {ordersState.total}{" "}
                orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingOrders}
                  onClick={() => void loadOrders(1)}
                >
                  Apply filters
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loadingOrders}
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPaymentStatusFilter("all");
                    setPaymentMethodFilter("all");
                    setFromDate("");
                    setToDate("");
                    void loadOrders(1);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              {loadingOrders ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Loading orders…
                </div>
              ) : ordersState.orders.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No orders found.
                </div>
              ) : (
                <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1  [&::-webkit-scrollbar-track]:bg-foreground/20  [&::-webkit-scrollbar-thumb]:bg-foreground/20">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Order</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-left">Amounts</th>
                        <th className="px-4 py-2 text-left">Payment</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersState.orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t text-slate-700 hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs">
                              <div className="font-semibold text-sm">
                                {order.orderNumber}
                              </div>
                              <div className="text-slate-500 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {order.items.length} items
                              </div>
                              <div className="text-slate-500">
                                Created{" "}
                                {new Date(order.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs">
                              <div className="font-medium">
                                {order.user?.name || "Unknown"}
                              </div>
                              {order.user?.email && (
                                <div className="text-slate-500">
                                  {order.user.email}
                                </div>
                              )}
                              {order.address?.city && (
                                <div className="text-slate-500">
                                  {order.address.city}, {order.address.country}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>
                                Total: Rs{" "}
                                {Number(order.totalAmount).toLocaleString()}
                              </div>
                              <div className="text-slate-500">
                                Subtotal: Rs{" "}
                                {Number(order.subTotal).toLocaleString()}
                              </div>
                              <div className="text-slate-500">
                                Shipping: Rs{" "}
                                {Number(order.shippingFee).toLocaleString()}
                                {order.discountAmount > 0 && (
                                  <span>
                                    {" "}
                                    • Discount: Rs{" "}
                                    {Number(
                                      order.discountAmount
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>{order.paymentMethod}</div>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  order.paymentStatus === "SUCCEEDED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : order.paymentStatus === "PENDING"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  order.status === "DELIVERED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : order.status === "CANCELLED" ||
                                      order.status === "RETURNED" ||
                                      order.status === "REFUNDED"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {order.status}
                              </span>
                              {order.placedAt && (
                                <div className="text-slate-500">
                                  Placed{" "}
                                  {new Date(order.placedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void loadOrderDetail(order.id)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loadingOrders || ordersState.page <= 1}
                  onClick={() => void loadOrders(ordersState.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loadingOrders || ordersState.page >= totalPages}
                  onClick={() => void loadOrders(ordersState.page + 1)}
                >
                  Next
                </Button>
              </div>
              <span>
                Page {ordersState.page} of {totalPages}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Order details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDetail && (
              <div className="text-sm text-muted-foreground">
                Loading order details…
              </div>
            )}
            {!loadingDetail && !selectedOrder && (
              <div className="text-sm text-muted-foreground">
                Select an order from the list to view details.
              </div>
            )}
            {!loadingDetail && selectedOrder && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {selectedOrder.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        Created{" "}
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div>
                        Total: Rs{" "}
                        {Number(selectedOrder.totalAmount).toLocaleString()}
                      </div>
                      <div className="text-slate-500">
                        Subtotal: Rs{" "}
                        {Number(selectedOrder.subTotal).toLocaleString()}
                      </div>
                      <div className="text-slate-500">
                        Shipping: Rs{" "}
                        {Number(selectedOrder.shippingFee).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-sm">Customer</div>
                    <div>{selectedOrder.user?.name || "Unknown"}</div>
                    {selectedOrder.user?.email && (
                      <div className="text-slate-500">
                        {selectedOrder.user.email}
                      </div>
                    )}
                    {selectedOrder.user?.phoneNumber && (
                      <div className="text-slate-500">
                        {selectedOrder.user.phoneNumber}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-sm">
                      Shipping address
                    </div>
                    {selectedOrder.address ? (
                      <div className="text-slate-600 space-y-0.5">
                        {selectedOrder.address.fullName && (
                          <div>{selectedOrder.address.fullName}</div>
                        )}
                        {selectedOrder.address.streetAddress && (
                          <div>{selectedOrder.address.streetAddress}</div>
                        )}
                        <div>
                          {selectedOrder.address.city},{" "}
                          {selectedOrder.address.state}
                        </div>
                        <div>
                          {selectedOrder.address.country}{" "}
                          {selectedOrder.address.postalCode}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        No address on record.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Order status</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) =>
                        void handleUpdateOrder(selectedOrder.id, {
                          status: value as OrderStatusType,
                        })
                      }
                      disabled={updatingOrderId === selectedOrderId}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(OrderStatusConst).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment status</Label>
                    <Select
                      value={selectedOrder.paymentStatus}
                      onValueChange={(value) =>
                        void handleUpdateOrder(selectedOrder.id, {
                          paymentStatus: value as PaymentStatusType,
                        })
                      }
                      disabled={updatingOrderId === selectedOrderId}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PaymentStatusConst).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedOrder.payment && (
                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-sm">Payment</div>
                    <div className="text-slate-600">
                      Provider: {selectedOrder.payment.provider}
                    </div>
                    <div className="text-slate-600">
                      Amount: Rs{" "}
                      {Number(selectedOrder.payment.amount).toLocaleString()}
                    </div>
                    {selectedOrder.payment.providerTxId && (
                      <div className="text-slate-500">
                        Tx ID: {selectedOrder.payment.providerTxId}
                      </div>
                    )}
                    <div className="text-slate-500">
                      Created{" "}
                      {new Date(
                        selectedOrder.payment.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="font-semibold text-sm">Items</div>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Product</th>
                          <th className="px-3 py-2 text-left">Quantity</th>
                          <th className="px-3 py-2 text-left">Price</th>
                          <th className="px-3 py-2 text-left">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-t text-slate-700">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.product?.title || item.title}
                                </span>
                                {item.variant && (
                                  <span className="text-slate-500">
                                    {item.variant.title}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">
                              Rs {Number(item.price).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              Rs {Number(item.lineTotal).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedOrder.logs.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">Activity</div>
                    <div className="border rounded-md max-h-52 overflow-y-auto">
                      <ul className="divide-y text-xs">
                        {selectedOrder.logs.map((log) => (
                          <li key={log.id} className="px-3 py-2 space-y-0.5">
                            <div className="text-slate-700">{log.message}</div>
                            <div className="text-slate-500 flex justify-between gap-2">
                              <span>
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                              {log.actor && (
                                <span>{log.actor.name || log.actor.email}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
