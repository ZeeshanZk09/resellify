"use client";

import { Loader, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type GetMyOrders, getMyOrders } from "@/actions/order";
import { Button } from "@/shared/components/ui/button";

export default function MyOrders() {
  const [orders, setOrders] = useState<GetMyOrders>();
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const printRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Fetch user orders from API
    async function fetchOrders() {
      setLoading(true);
      try {
        const { orders } = await getMyOrders();
        setOrders(orders);
      } catch (err: any) {
        setOrders([]);
        toast.error(
          err?.message || "Failed to load your orders. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // Export order receipt as print
  const handleExportOrder = (orderId: string) => {
    const printContents = printRefs.current[orderId]?.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (printWindow && printContents) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px 20px;
                background: #fafbfc;
              }
              .receipt-title {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 18px;
                color: #16a34a;
              }
              .receipt-container {
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px 16px;
                margin: 0 auto;
                max-width: 700px;
                box-shadow: 0 2px 12px #0000000b;
                color: #222;
              }
              .receipt-section {
                margin-bottom: 18px;
              }
              .receipt-summary {
                margin-top: 18px;
                border-top: 1px solid #eee;
                padding-top: 12px;
                font-size: 1rem;
              }
              .receipt-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
                margin-bottom: 1rem;
              }
              .receipt-table th, .receipt-table td {
                border: 1px solid #e5e7eb;
                padding: 8px 10px;
                text-align: left;
              }
              .receipt-table th {
                background: #f3f4f6;
                font-weight: 600;
              }
              .right {
                text-align: right;
              }
              .green { color: #22c55e !important;font-weight: 700;}
              .gray { color: #555;}
              .borderd {border-top: 1px solid #e5e7eb;}
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Print after DOM loaded
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 min-h-[60vh] w-full">
        <div className="w-full max-w-2xl flex flex-col gap-6 px-2 sm:px-0">
          {/* Skeleton for header */}
          <div className="h-7 w-5/6 sm:w-2/5 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
          {/* Skeleton for multiple orders */}
          {[...Array(2)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-lg p-3 sm:p-5 shadow flex flex-col gap-3 animate-pulse"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="h-5 w-4/6 sm:w-32 bg-gray-200 rounded" />
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="h-5 w-1/3 sm:w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-1/2 sm:w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mt-2">
                {/* Image skeleton(s) */}
                <div className="col-span-1 flex justify-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-md" />
                </div>
                {/* Details skeleton */}
                <div className="col-span-1 sm:col-span-5 flex flex-col gap-2 justify-center">
                  <div className="h-4 w-2/3 sm:w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 sm:w-32 bg-gray-100 rounded" />
                  <div className="h-4 w-1/3 sm:w-28 bg-gray-100 rounded" />
                </div>
              </div>
              {/* Skeleton for totals */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-5 pt-2">
                <div className="h-5 w-3/5 sm:w-20 bg-gray-200 rounded" />
                <div className="h-5 w-2/3 sm:w-24 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-7xl w-full sm:w-11/12 mx-auto p-6 flex flex-col items-center">
        <ShoppingBag size={38} className="text-primary mb-2" />
        <h1 className="text-xl font-semibold mb-2 text-center">
          No Orders Yet
        </h1>
        <p className="mb-4 text-gray-500 text-center">
          Looks like you have not placed any orders yet.
        </p>
        <Button
          className="w-full sm:w-auto"
          onClick={() => router.push("/shop")}
        >
          Go Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 flex gap-2 sm:gap-3 items-center">
        <ShoppingBag size={24} className="text-green-500 sm:hidden" />
        <ShoppingBag size={28} className="text-green-500 hidden sm:block" />
        <span>My Orders</span>
      </h1>
      <div className="flex flex-col gap-4 sm:gap-8">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white shadow rounded-lg p-3 sm:p-5 border border-gray-100 flex flex-col gap-2"
          >
            {/* --- hidden receipt: This will be printed --- */}
            <div
              style={{ display: "none" }}
              ref={(el) => {
                printRefs.current[order.id] = el!;
              }}
            >
              <div className="receipt-container">
                <div className="receipt-title">Order Receipt</div>
                <div className="receipt-section">
                  <div>
                    <span className="gray">Order #</span>{" "}
                    <b>{order.orderNumber}</b>
                  </div>
                  <div>
                    <span className="gray">Status:</span>{" "}
                    <span className="green">{order.status}</span>
                  </div>
                  <div>
                    <span className="gray">Placed At:</span>
                    <span>
                      {" "}
                      {order?.placedAt
                        ? new Date(order.placedAt)
                            .toLocaleString("en-CA", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })
                            .replace(",", "")
                            .replace(/\//g, "-")
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="receipt-section">
                  <table className="receipt-table">
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
                      {order?.items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product.title}</td>
                          <td>{item.variant?.title || "-"}</td>
                          <td className="right">{item.quantity}</td>
                          <td className="right">
                            PKR {item.price?.toLocaleString()}
                          </td>
                          <td className="right">
                            PKR {item.lineTotal?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="receipt-summary">
                  <div>
                    <span className="gray">Payment:</span>{" "}
                    <b>{order.paymentMethod}</b>
                  </div>
                  <div>
                    <span className="gray">Order Total:</span>{" "}
                    <b className="green">
                      PKR {order.totalAmount?.toLocaleString()}
                    </b>
                  </div>
                  <div>
                    <span className="gray">Shipping Fee:</span>{" "}
                    <b>PKR {order.shippingFee?.toLocaleString()}</b>
                  </div>
                  <div>
                    <span className="gray">You Saved:</span>{" "}
                    <b className="green">
                      PKR {order.discountAmount?.toLocaleString()}
                    </b>
                  </div>
                </div>
              </div>
            </div>
            {/* --- end hidden receipt content --- */}

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
              <div className="text-primary font-semibold text-sm break-all">
                #{order.orderNumber}
              </div>
              <div className="flex flex-row items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === "DELIVERED"
                      ? "bg-green-100 text-green-700"
                      : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : order.status === "CREATED"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
                <span className="text-xs text-gray-400 block">
                  {order?.placedAt
                    ? new Date(order.placedAt)
                        .toLocaleString("en-CA", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })
                        .replace(",", "")
                        .replace(/\//g, "-")
                    : ""}
                </span>
              </div>
            </div>
            {/* ORDER ITEMS */}
            <div className="divide-y">
              {order?.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row py-2 sm:py-3 gap-2 sm:gap-4 items-start sm:items-center"
                >
                  <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    {item.product.images?.[0]?.path ? (
                      <Image
                        src={item.product.images[0].path}
                        alt={item.product.title}
                        className="object-cover"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <div className="font-medium text-gray-900">
                        {item.product.title}
                      </div>
                      {item.variant?.title && (
                        <span className="ml-0 sm:ml-2 text-gray-500 text-sm">
                          ({item.variant.title})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Quantity:{" "}
                      <span className="font-semibold">{item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right min-w-[80px] w-full sm:w-auto mt-1 sm:mt-0">
                    <div className="font-semibold text-gray-800">
                      PKR {item.price?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">{`Total: PKR ${item.lineTotal?.toLocaleString()}`}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* ORDER SUMMARY */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 mt-3 sm:mt-4 border-t pt-2 sm:pt-3">
              <div>
                <div className="text-xs text-gray-500">Payment:</div>
                <div className="font-medium text-sm">{order.paymentMethod}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Order Total:</div>
                <div className="font-bold text-base sm:text-lg text-primary">
                  PKR {order.totalAmount?.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Shipping Fee</div>
                <div className="text-sm">
                  PKR {order.shippingFee?.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">You Saved</div>
                <div className="text-sm text-green-600">
                  PKR {order.discountAmount?.toLocaleString()}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 mt-3 sm:mt-4 text-sm w-full">
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleExportOrder(order.id)}
              >
                Export
              </Button>
              {/* <Button size="sm" variant="ghost">Track</Button> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
