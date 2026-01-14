"use client";

import { FileText, Filter, Printer, RefreshCcw, Search } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type {
  OrderStatus as OrderStatusType,
  PaymentMethod as PaymentMethodType,
  PaymentStatus as PaymentStatusType,
} from "@/shared/lib/generated/prisma/enums";
import {
  OrderStatus as OrderStatusConst,
  PaymentMethod as PaymentMethodConst,
  PaymentStatus as PaymentStatusConst,
} from "@/shared/lib/generated/prisma/enums";

type OrderStatusFilter = "all" | OrderStatusType;
type PaymentStatusFilter = "all" | PaymentStatusType;
type PaymentMethodFilter = "all" | PaymentMethodType;

type AdminInvoiceUser = {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
};

type AdminInvoiceAddress = {
  id: string;
  fullName: string | null;
  phone?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode?: string | null;
  label?: string | null;
  whatsappNumber?: string | null;
  nearbyLandmark?: string | null;
  area?: string | null;
  line1?: string | null;
  line2?: string | null;
};

type AdminInvoiceSummary = {
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
  user: AdminInvoiceUser | null;
  address: AdminInvoiceAddress | null;
  payment: {
    id: string;
    provider: string;
    providerTxId: string | null;
    method: PaymentMethodType;
    amount: number;
    status: PaymentStatusType;
    createdAt: string;
  } | null;
};

type PaginatedInvoices = {
  invoices: AdminInvoiceSummary[];
  total: number;
  page: number;
  pageSize: number;
};

type AdminInvoiceItem = {
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

type AdminInvoicePayment = {
  id: string;
  provider: string;
  providerTxId: string | null;
  method: PaymentMethodType;
  amount: number;
  status: PaymentStatusType;
  createdAt: string;
};

type AdminInvoiceDetail = AdminInvoiceSummary & {
  items: AdminInvoiceItem[];
  payment: AdminInvoicePayment | null;
};

export default function AdminInvoicesPage() {
  const [invoicesState, setInvoicesState] = useState<PaginatedInvoices>({
    invoices: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [selectedInvoice, setSelectedInvoice] =
    useState<AdminInvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const printRef = useRef<HTMLDivElement | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(invoicesState.total / invoicesState.pageSize)),
    [invoicesState.total, invoicesState.pageSize],
  );

  const loadInvoices = useCallback(
    async (page?: number) => {
      try {
        setLoadingInvoices(true);
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
        if (minTotal) {
          params.set("minTotal", minTotal);
        }
        if (maxTotal) {
          params.set("maxTotal", maxTotal);
        }
        params.set("page", String(page ?? invoicesState.page));
        params.set("pageSize", String(invoicesState.pageSize));

        const res = await fetch(`/api/admin/invoices?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.message || "Failed to load invoices");
          return;
        }
        const data = (await res.json()) as PaginatedInvoices;
        setInvoicesState({
          invoices: data.invoices || [],
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.pageSize || invoicesState.pageSize,
        });
      } catch {
        toast.error("Failed to load invoices");
      } finally {
        setLoadingInvoices(false);
      }
    },
    [
      search,
      statusFilter,
      paymentStatusFilter,
      paymentMethodFilter,
      fromDate,
      toDate,
      minTotal,
      maxTotal,
      invoicesState.page,
      invoicesState.pageSize,
    ],
  );

  const loadInvoiceDetail = useCallback(async (invoiceId: string) => {
    try {
      setLoadingDetail(true);
      setSelectedInvoiceId(invoiceId);
      const res = await fetch(`/api/admin/invoices?id=${invoiceId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to load invoice details");
        return;
      }
      const data = (await res.json()) as { invoice: AdminInvoiceDetail };
      setSelectedInvoice(data.invoice);
    } catch {
      toast.error("Failed to load invoice details");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handlePrintInvoice = useCallback(() => {
    if (!selectedInvoice || !printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (printWindow && printContents) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px 20px;
                background: #fafbfc;
              }
              .invoice-title {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 18px;
                color: #16a34a;
              }
              .invoice-container {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px 16px;
                margin: 0 auto;
                max-width: 700px;
                box-shadow: 0 2px 12px #0000000b;
                color: #222;
              }
              .invoice-section {
                margin-bottom: 18px;
              }
              .invoice-summary {
                margin-top: 18px;
                border-top: 1px solid #eee;
                padding-top: 12px;
                font-size: 1rem;
              }
              .invoice-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
                margin-bottom: 1rem;
              }
              .invoice-table th, .invoice-table td {
                border: 1px solid #e5e7eb;
                padding: 8px 10px;
                text-align: left;
              }
              .invoice-table th {
                background: #f3f4f6;
                font-weight: 600;
              }
              .right {
                text-align: right;
              }
              .green { color: #22c55e !important;font-weight: 700;}
              .gray { color: #555;}
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [selectedInvoice]);

  useEffect(() => {
    void loadInvoices(1);
  }, [loadInvoices]);

  return (
    <section className="py-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl text-slate-700">
            Manage{" "}
            <span className="font-semibold text-slate-900">Invoices</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, filter, and print customer invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadInvoices(invoicesState.page)}
            disabled={loadingInvoices}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handlePrintInvoice()}
            disabled={!selectedInvoice}
          >
            <Printer className="h-4 w-4" />
            Print invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Invoice list
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
                    placeholder="Invoice #, name, email, TX id"
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
              <div className="space-y-1.5">
                <Label>Min total</Label>
                <Input
                  type="number"
                  value={minTotal}
                  onChange={(e) => setMinTotal(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max total</Label>
                <Input
                  type="number"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Showing {invoicesState.invoices.length} of {invoicesState.total}{" "}
                invoices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingInvoices}
                  onClick={() => void loadInvoices(1)}
                >
                  Apply filters
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loadingInvoices}
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPaymentStatusFilter("all");
                    setPaymentMethodFilter("all");
                    setFromDate("");
                    setToDate("");
                    setMinTotal("");
                    setMaxTotal("");
                    void loadInvoices(1);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              {loadingInvoices ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Loading invoices…
                </div>
              ) : invoicesState.invoices.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No invoices found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Invoice</th>
                        <th className="px-4 py-2 text-left">Customer</th>
                        <th className="px-4 py-2 text-left">Payment</th>
                        <th className="px-4 py-2 text-left">Amounts</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesState.invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-t text-slate-700 hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs">
                              <div className="font-semibold text-sm">
                                #{invoice.orderNumber}
                              </div>
                              <div className="text-slate-500">
                                Created{" "}
                                {new Date(invoice.createdAt).toLocaleString()}
                              </div>
                              {invoice.placedAt && (
                                <div className="text-slate-500">
                                  Placed{" "}
                                  {new Date(invoice.placedAt).toLocaleString()}
                                </div>
                              )}
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  invoice.status === "DELIVERED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : invoice.status === "CANCELLED" ||
                                        invoice.status === "RETURNED" ||
                                        invoice.status === "REFUNDED"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs">
                              <div className="font-medium">
                                {invoice.user?.name || "Unknown"}
                              </div>
                              {invoice.user?.email && (
                                <div className="text-slate-500">
                                  {invoice.user.email}
                                </div>
                              )}
                              {invoice.address?.city && (
                                <div className="text-slate-500">
                                  {invoice.address.city},{" "}
                                  {invoice.address.country}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>{invoice.paymentMethod}</div>
                              {invoice.payment && (
                                <div className="text-slate-500">
                                  {invoice.payment.provider}
                                </div>
                              )}
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  invoice.paymentStatus === "SUCCEEDED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : invoice.paymentStatus === "PENDING"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {invoice.paymentStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1 text-xs text-slate-600">
                              <div>
                                Total: Rs{" "}
                                {Number(invoice.totalAmount).toLocaleString()}
                              </div>
                              <div className="text-slate-500">
                                Subtotal: Rs{" "}
                                {Number(invoice.subTotal).toLocaleString()}
                              </div>
                              <div className="text-slate-500">
                                Shipping: Rs{" "}
                                {Number(invoice.shippingFee).toLocaleString()}
                                {invoice.discountAmount > 0 && (
                                  <span>
                                    {" "}
                                    • Discount: Rs{" "}
                                    {Number(
                                      invoice.discountAmount,
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void loadInvoiceDetail(invoice.id)
                                }
                              >
                                <FileText className="h-4 w-4" />
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
                  disabled={loadingInvoices || invoicesState.page <= 1}
                  onClick={() => void loadInvoices(invoicesState.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loadingInvoices || invoicesState.page >= totalPages}
                  onClick={() => void loadInvoices(invoicesState.page + 1)}
                >
                  Next
                </Button>
              </div>
              <span>
                Page {invoicesState.page} of {totalPages}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoice details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDetail && (
              <div className="text-sm text-muted-foreground">
                Loading invoice details…
              </div>
            )}
            {!loadingDetail && !selectedInvoice && (
              <div className="text-sm text-muted-foreground">
                Select an invoice from the list to view details.
              </div>
            )}
            {!loadingDetail && selectedInvoice && (
              <>
                <div className="space-y-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          Invoice #{selectedInvoice.orderNumber}
                        </div>
                        <div className="text-xs text-slate-500">
                          Created{" "}
                          {new Date(selectedInvoice.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <div>
                          Total: Rs{" "}
                          {Number(selectedInvoice.totalAmount).toLocaleString()}
                        </div>
                        <div className="text-slate-500">
                          Subtotal: Rs{" "}
                          {Number(selectedInvoice.subTotal).toLocaleString()}
                        </div>
                        <div className="text-slate-500">
                          Shipping: Rs{" "}
                          {Number(selectedInvoice.shippingFee).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="font-semibold text-sm">Bill to</div>
                      <div>{selectedInvoice.user?.name || "Unknown"}</div>
                      {selectedInvoice.user?.email && (
                        <div className="text-slate-500 text-xs">
                          {selectedInvoice.user.email}
                        </div>
                      )}
                      {selectedInvoice.user?.phoneNumber && (
                        <div className="text-slate-500 text-xs">
                          {selectedInvoice.user.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="font-semibold text-sm">
                        Billing address
                      </div>
                      {selectedInvoice.address ? (
                        <div className="text-slate-600 space-y-0.5 text-xs">
                          {selectedInvoice.address.fullName && (
                            <div>{selectedInvoice.address.fullName}</div>
                          )}
                          {selectedInvoice.address.line1 && (
                            <div>{selectedInvoice.address.line1}</div>
                          )}
                          {selectedInvoice.address.line2 && (
                            <div>{selectedInvoice.address.line2}</div>
                          )}
                          <div>
                            {selectedInvoice.address.city},{" "}
                            {selectedInvoice.address.state}
                          </div>
                          <div>
                            {selectedInvoice.address.country}{" "}
                            {selectedInvoice.address.postalCode}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs">
                          No address on record.
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedInvoice.payment && (
                    <div className="space-y-1.5 text-xs">
                      <div className="font-semibold text-sm">Payment</div>
                      <div className="text-slate-600">
                        Provider: {selectedInvoice.payment.provider}
                      </div>
                      <div className="text-slate-600">
                        Method: {selectedInvoice.payment.method}
                      </div>
                      <div className="text-slate-600">
                        Amount: Rs{" "}
                        {Number(
                          selectedInvoice.payment.amount,
                        ).toLocaleString()}
                      </div>
                      <div className="text-slate-600">
                        Status: {selectedInvoice.payment.status}
                      </div>
                      {selectedInvoice.payment.providerTxId && (
                        <div className="text-slate-500">
                          Tx ID: {selectedInvoice.payment.providerTxId}
                        </div>
                      )}
                      <div className="text-slate-500">
                        Created{" "}
                        {new Date(
                          selectedInvoice.payment.createdAt,
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
                          {selectedInvoice.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t text-slate-700"
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 rounded overflow-hidden bg-slate-100 flex items-center justify-center">
                                    {item.product.images?.[0]?.path ? (
                                      <Image
                                        src={item.product.images[0].path}
                                        alt={item.product.title}
                                        width={36}
                                        height={36}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-slate-200" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {item.product.title || item.title}
                                    </span>
                                    {item.variant && (
                                      <span className="text-slate-500">
                                        {item.variant.title}
                                      </span>
                                    )}
                                  </div>
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

                  {selectedInvoice.notes && (
                    <div className="space-y-1.5 text-xs">
                      <div className="font-semibold text-sm">Notes</div>
                      <div className="text-slate-600">
                        {selectedInvoice.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden">
                  <div ref={printRef}>
                    <div className="invoice-container">
                      <div className="invoice-title">Invoice</div>
                      <div className="invoice-section">
                        <div>
                          <span className="gray">Invoice #</span>{" "}
                          <b>{selectedInvoice.orderNumber}</b>
                        </div>
                        <div>
                          <span className="gray">Status:</span>{" "}
                          <span className="green">
                            {selectedInvoice.paymentStatus}
                          </span>
                        </div>
                        <div>
                          <span className="gray">Created:</span>
                          <span>
                            {" "}
                            {new Date(
                              selectedInvoice.createdAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="invoice-section">
                        <table className="invoice-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Variant</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.product.title || item.title}</td>
                                <td>{item.variant?.title || "-"}</td>
                                <td className="right">{item.quantity}</td>
                                <td className="right">
                                  Rs {Number(item.price).toLocaleString()}
                                </td>
                                <td className="right">
                                  Rs {Number(item.lineTotal).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="invoice-summary">
                        <div>
                          <span className="gray">Payment method:</span>{" "}
                          <b>{selectedInvoice.paymentMethod}</b>
                        </div>
                        <div>
                          <span className="gray">Invoice Total:</span>{" "}
                          <b className="green">
                            Rs{" "}
                            {Number(
                              selectedInvoice.totalAmount,
                            ).toLocaleString()}
                          </b>
                        </div>
                        <div>
                          <span className="gray">Shipping Fee:</span>{" "}
                          <b>
                            Rs{" "}
                            {Number(
                              selectedInvoice.shippingFee,
                            ).toLocaleString()}
                          </b>
                        </div>
                        <div>
                          <span className="gray">You Saved:</span>{" "}
                          <b className="green">
                            Rs{" "}
                            {Number(
                              selectedInvoice.discountAmount,
                            ).toLocaleString()}
                          </b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
