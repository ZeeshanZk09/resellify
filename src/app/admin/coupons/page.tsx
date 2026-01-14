"use client";

import {
  Filter,
  GiftIcon,
  PercentIcon,
  RefreshCcw,
  TicketPercentIcon,
  Trash2,
} from "lucide-react";
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
import { Switch } from "@/shared/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import type {
  Category,
  Coupon,
  Offer,
} from "@/shared/lib/generated/prisma/browser";

type CouponWithMeta = Coupon & {
  category?: Pick<Category, "id" | "name"> | null;
  _count?: {
    redemptions: number;
    products: number;
    productOffers: number;
  } | null;
};

type OfferWithMeta = Offer & {
  category?: Pick<Category, "id" | "name"> | null;
  productOffers?: Array<{ id: string; productId: string | null }> | null;
};

type PaginatedCoupons = {
  coupons: CouponWithMeta[];
  total: number;
  page: number;
  pageSize: number;
};

type PaginatedOffers = {
  offers: OfferWithMeta[];
  total: number;
  page: number;
  pageSize: number;
};

type CategoryOption = Pick<Category, "id" | "name">;

export default function AdminCouponsPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "offers">("coupons");

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [couponState, setCouponState] = useState<PaginatedCoupons>({
    coupons: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [couponSearch, setCouponSearch] = useState("");
  const [couponStatus, setCouponStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [couponType, setCouponType] = useState<"all" | "PERCENT" | "FIXED">(
    "all"
  );
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const [offerState, setOfferState] = useState<PaginatedOffers>({
    offers: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [offerSearch, setOfferSearch] = useState("");
  const [offerStatus, setOfferStatus] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [offerTarget, setOfferTarget] = useState<
    "all" | "ALL_PRODUCTS" | "CATEGORY" | "PRODUCT"
  >("all");
  const [loadingOffers, setLoadingOffers] = useState(false);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    type: "PERCENT",
    value: "",
    discountType: "PERCENT",
    isActive: true,
    startsAt: "",
    endsAt: "",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "",
    firstOrderOnly: false,
    stackable: false,
    minOrderValue: "",
    minOrderPrice: "",
    priority: "",
    categoryId: "",
  });

  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    type: "PERCENT",
    offType: "ALL_PRODUCTS",
    value: "",
    discountType: "PERCENT",
    isActive: true,
    startsAt: "",
    endsAt: "",
    maxDiscount: "",
    appliesToAll: true,
    priority: "",
    categoryId: "",
  });

  const totalCouponPages = useMemo(
    () => Math.max(1, Math.ceil(couponState.total / couponState.pageSize)),
    [couponState.total, couponState.pageSize]
  );

  const totalOfferPages = useMemo(
    () => Math.max(1, Math.ceil(offerState.total / offerState.pageSize)),
    [offerState.total, offerState.pageSize]
  );

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Failed to load categories");
        return;
      }
      const data = (await res.json()) as {
        categories: Array<{ id: string; name: string }>;
      };
      setCategories(data.categories || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadCoupons = useCallback(
    async (page?: number) => {
      try {
        setLoadingCoupons(true);
        const params = new URLSearchParams();
        if (couponSearch.trim()) params.set("search", couponSearch.trim());
        if (couponType !== "all") params.set("type", couponType);
        if (couponStatus === "active") params.set("isActive", "true");
        if (couponStatus === "inactive") params.set("isActive", "false");
        params.set("page", String(page ?? couponState.page));
        params.set("pageSize", String(couponState.pageSize));

        const res = await fetch(`/api/admin/coupons?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.message || "Failed to load coupons");
          return;
        }
        const data = (await res.json()) as PaginatedCoupons;
        setCouponState({
          coupons: data.coupons || [],
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.pageSize || couponState.pageSize,
        });
      } catch {
        toast.error("Failed to load coupons");
      } finally {
        setLoadingCoupons(false);
      }
    },
    [
      couponSearch,
      couponStatus,
      couponType,
      couponState.page,
      couponState.pageSize,
    ]
  );

  const loadOffers = useCallback(
    async (page?: number) => {
      try {
        setLoadingOffers(true);
        const params = new URLSearchParams();
        if (offerSearch.trim()) params.set("search", offerSearch.trim());
        if (offerTarget !== "all") params.set("offType", offerTarget);
        if (offerStatus === "active") params.set("isActive", "true");
        if (offerStatus === "inactive") params.set("isActive", "false");
        params.set("page", String(page ?? offerState.page));
        params.set("pageSize", String(offerState.pageSize));

        const res = await fetch(`/api/admin/offers?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.message || "Failed to load offers");
          return;
        }
        const data = (await res.json()) as PaginatedOffers;
        setOfferState({
          offers: data.offers || [],
          total: data.total || 0,
          page: data.page || 1,
          pageSize: data.pageSize || offerState.pageSize,
        });
      } catch {
        toast.error("Failed to load offers");
      } finally {
        setLoadingOffers(false);
      }
    },
    [
      offerSearch,
      offerStatus,
      offerTarget,
      offerState.page,
      offerState.pageSize,
    ]
  );

  useEffect(() => {
    void loadCategories();
    void loadCoupons(1);
    void loadOffers(1);
  }, [loadCategories, loadCoupons, loadOffers]);

  const handleCreateCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    const valueNumber = Number(newCoupon.value);
    if (Number.isNaN(valueNumber) || valueNumber <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCoupon.code.trim(),
          description: newCoupon.description.trim() || undefined,
          type: newCoupon.type,
          value: valueNumber,
          discountType: newCoupon.discountType,
          isActive: newCoupon.isActive,
          startsAt: newCoupon.startsAt || null,
          endsAt: newCoupon.endsAt || null,
          maxDiscount: newCoupon.maxDiscount
            ? Number(newCoupon.maxDiscount)
            : null,
          usageLimit: newCoupon.usageLimit
            ? Number(newCoupon.usageLimit)
            : null,
          perUserLimit: newCoupon.perUserLimit
            ? Number(newCoupon.perUserLimit)
            : null,
          firstOrderOnly: newCoupon.firstOrderOnly,
          stackable: newCoupon.stackable,
          minOrderValue: newCoupon.minOrderValue
            ? Number(newCoupon.minOrderValue)
            : null,
          minOrderPrice: newCoupon.minOrderPrice
            ? Number(newCoupon.minOrderPrice)
            : null,
          priority: newCoupon.priority ? Number(newCoupon.priority) : 0,
          categoryId: newCoupon.categoryId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to create coupon");
        return;
      }
      toast.success("Coupon created");
      setNewCoupon({
        code: "",
        description: "",
        type: newCoupon.type,
        value: "",
        discountType: newCoupon.discountType,
        isActive: true,
        startsAt: "",
        endsAt: "",
        maxDiscount: "",
        usageLimit: "",
        perUserLimit: "",
        firstOrderOnly: false,
        stackable: false,
        minOrderValue: "",
        minOrderPrice: "",
        priority: "",
        categoryId: "",
      });
      void loadCoupons(1);
    } catch {
      toast.error("Failed to create coupon");
    }
  };

  const handleToggleCouponActive = async (coupon: CouponWithMeta) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coupon.id,
          isActive: !coupon.isActive,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to update coupon");
        return;
      }
      setCouponState((prev) => ({
        ...prev,
        coupons: prev.coupons.map((c) =>
          c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
        ),
      }));
      toast.success("Coupon status updated");
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: couponId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to delete coupon");
        return;
      }
      toast.success("Coupon deleted");
      setCouponState((prev) => ({
        ...prev,
        coupons: prev.coupons.filter((c) => c.id !== couponId),
        total: Math.max(0, prev.total - 1),
      }));
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const handleCreateOffer = async () => {
    if (!newOffer.title.trim()) {
      toast.error("Offer title is required");
      return;
    }
    const valueNumber = Number(newOffer.value);
    if (Number.isNaN(valueNumber) || valueNumber <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newOffer.title.trim(),
          description: newOffer.description.trim() || undefined,
          type: newOffer.type,
          offType: newOffer.offType,
          value: valueNumber,
          discountType: newOffer.discountType,
          isActive: newOffer.isActive,
          startsAt: newOffer.startsAt || null,
          endsAt: newOffer.endsAt || null,
          maxDiscount: newOffer.maxDiscount
            ? Number(newOffer.maxDiscount)
            : null,
          appliesToAll: newOffer.appliesToAll,
          priority: newOffer.priority ? Number(newOffer.priority) : 0,
          categoryId: newOffer.categoryId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to create offer");
        return;
      }
      toast.success("Offer created");
      setNewOffer({
        title: "",
        description: "",
        type: newOffer.type,
        offType: newOffer.offType,
        value: "",
        discountType: newOffer.discountType,
        isActive: true,
        startsAt: "",
        endsAt: "",
        maxDiscount: "",
        appliesToAll: true,
        priority: "",
        categoryId: "",
      });
      void loadOffers(1);
    } catch {
      toast.error("Failed to create offer");
    }
  };

  const handleToggleOfferActive = async (offer: OfferWithMeta) => {
    try {
      const res = await fetch("/api/admin/offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offer.id,
          isActive: !offer.isActive,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to update offer");
        return;
      }
      setOfferState((prev) => ({
        ...prev,
        offers: prev.offers.map((o) =>
          o.id === offer.id ? { ...o, isActive: !o.isActive } : o
        ),
      }));
      toast.success("Offer status updated");
    } catch {
      toast.error("Failed to update offer");
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const res = await fetch("/api/admin/offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offerId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message || "Failed to delete offer");
        return;
      }
      toast.success("Offer deleted");
      setOfferState((prev) => ({
        ...prev,
        offers: prev.offers.filter((o) => o.id !== offerId),
        total: Math.max(0, prev.total - 1),
      }));
    } catch {
      toast.error("Failed to delete offer");
    }
  };

  return (
    <section className="py-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl text-slate-700">
            Manage{" "}
            <span className="font-semibold text-slate-900">
              Coupons, Offers & Deals
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure promotion rules, stackability and time windows for your
            store.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void loadCoupons(couponState.page);
            void loadOffers(offerState.page);
          }}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "coupons" | "offers")}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="coupons">
            <TicketPercentIcon className="h-4 w-4" />
            Coupons
          </TabsTrigger>
          <TabsTrigger value="offers">
            <GiftIcon className="h-4 w-4" />
            Offers & Deals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TicketPercentIcon className="h-5 w-5 text-primary" />
                  Create coupon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-code">Code</Label>
                    <Input
                      id="coupon-code"
                      value={newCoupon.code}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="SUMMER24"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-type">Type</Label>
                    <Select
                      value={newCoupon.type}
                      onValueChange={(value) =>
                        setNewCoupon((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FIXED">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="coupon-description">Description</Label>
                  <Input
                    id="coupon-description"
                    value={newCoupon.description}
                    onChange={(e) =>
                      setNewCoupon((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Short internal note"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-value">Discount value</Label>
                    <Input
                      id="coupon-value"
                      type="number"
                      min={0}
                      step="0.01"
                      value={newCoupon.value}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder={newCoupon.type === "PERCENT" ? "10" : "500"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount type</Label>
                    <Select
                      value={newCoupon.discountType}
                      onValueChange={(value) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          discountType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FLAT">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-max-discount">Max discount</Label>
                    <Input
                      id="coupon-max-discount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={newCoupon.maxDiscount}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          maxDiscount: e.target.value,
                        }))
                      }
                      placeholder="Optional safety cap"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-priority">Priority</Label>
                    <Input
                      id="coupon-priority"
                      type="number"
                      min={0}
                      step="1"
                      value={newCoupon.priority}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-starts">Starts at</Label>
                    <Input
                      id="coupon-starts"
                      type="datetime-local"
                      value={newCoupon.startsAt}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          startsAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-ends">Ends at</Label>
                    <Input
                      id="coupon-ends"
                      type="datetime-local"
                      value={newCoupon.endsAt}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          endsAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-usage-limit">Total uses</Label>
                    <Input
                      id="coupon-usage-limit"
                      type="number"
                      min={0}
                      step="1"
                      value={newCoupon.usageLimit}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          usageLimit: e.target.value,
                        }))
                      }
                      placeholder="Unlimited if empty"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-per-user-limit">
                      Per user limit
                    </Label>
                    <Input
                      id="coupon-per-user-limit"
                      type="number"
                      min={0}
                      step="1"
                      value={newCoupon.perUserLimit}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          perUserLimit: e.target.value,
                        }))
                      }
                      placeholder="Unlimited if empty"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-min-order-value">
                      Min order value
                    </Label>
                    <Input
                      id="coupon-min-order-value"
                      type="number"
                      min={0}
                      step="0.01"
                      value={newCoupon.minOrderValue}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          minOrderValue: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-min-order-price">
                      Min order price
                    </Label>
                    <Input
                      id="coupon-min-order-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={newCoupon.minOrderPrice}
                      onChange={(e) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          minOrderPrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Category (optional)</Label>
                    <Select
                      value={newCoupon.categoryId || "ALL_CATEGORIES"}
                      onValueChange={(value) =>
                        setNewCoupon((prev) => ({
                          ...prev,
                          categoryId: value === "ALL_CATEGORIES" ? "" : value,
                        }))
                      }
                      disabled={loadingCategories || categories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_CATEGORIES">
                          All categories
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6 sm:mt-8">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Active</Label>
                      <Switch
                        checked={newCoupon.isActive}
                        onCheckedChange={(checked) =>
                          setNewCoupon((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label>First order only</Label>
                      <Switch
                        checked={newCoupon.firstOrderOnly}
                        onCheckedChange={(checked) =>
                          setNewCoupon((prev) => ({
                            ...prev,
                            firstOrderOnly: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label>Stackable</Label>
                      <Switch
                        checked={newCoupon.stackable}
                        onCheckedChange={(checked) =>
                          setNewCoupon((prev) => ({
                            ...prev,
                            stackable: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    disabled={loadingCoupons}
                    onClick={handleCreateCoupon}
                  >
                    <PercentIcon className="h-4 w-4" />
                    Create coupon
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Active coupons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-1.5">
                    <Label>Search</Label>
                    <Input
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                      placeholder="Search by code or description"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={couponStatus}
                      onValueChange={(value) =>
                        setCouponStatus(value as typeof couponStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={couponType}
                      onValueChange={(value) =>
                        setCouponType(value as typeof couponType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FIXED">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {couponState.coupons.length} of {couponState.total}{" "}
                    coupons
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loadingCoupons}
                      onClick={() => void loadCoupons(1)}
                    >
                      Apply filters
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={loadingCoupons}
                      onClick={() => {
                        setCouponSearch("");
                        setCouponStatus("all");
                        setCouponType("all");
                        void loadCoupons(1);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  {loadingCoupons ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      Loading coupons…
                    </div>
                  ) : couponState.coupons.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      No coupons found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-2 text-left">Code</th>
                            <th className="px-4 py-2 text-left">Details</th>
                            <th className="px-4 py-2 text-left">Constraints</th>
                            <th className="px-4 py-2 text-left">Usage</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {couponState.coupons.map((coupon) => (
                            <tr
                              key={coupon.id}
                              className="border-t text-slate-700 hover:bg-slate-50/80"
                            >
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold">
                                    {coupon.code}
                                  </span>
                                  {coupon.description && (
                                    <span className="text-xs text-muted-foreground">
                                      {coupon.description}
                                    </span>
                                  )}
                                  {coupon.category && (
                                    <span className="text-[11px] text-slate-500">
                                      Category: {coupon.category.name}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs">
                                  <div>
                                    <span className="font-medium">
                                      {coupon.type === "PERCENT"
                                        ? `${coupon.value ?? 0}%`
                                        : `Rs ${coupon.value ?? 0}`}
                                    </span>{" "}
                                    <span className="text-slate-500">
                                      ({coupon.discountType})
                                    </span>
                                  </div>
                                  {coupon.maxDiscount != null && (
                                    <div className="text-slate-500">
                                      Max discount: Rs{" "}
                                      {Number(coupon.maxDiscount)}
                                    </div>
                                  )}
                                  <div className="text-slate-500">
                                    Priority: {coupon.priority ?? 0}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs text-slate-500">
                                  {coupon.minOrderValue != null && (
                                    <div>
                                      Min order value: Rs{" "}
                                      {Number(coupon.minOrderValue)}
                                    </div>
                                  )}
                                  {coupon.minOrderPrice != null && (
                                    <div>
                                      Min order price: Rs{" "}
                                      {Number(coupon.minOrderPrice)}
                                    </div>
                                  )}
                                  {coupon.firstOrderOnly && (
                                    <div>First order only</div>
                                  )}
                                  {coupon.stackable && (
                                    <div>Stackable with other discounts</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs text-slate-500">
                                  <div>
                                    Used:{" "}
                                    {coupon._count?.redemptions
                                      ? coupon._count.redemptions
                                      : 0}
                                    {coupon.usageLimit != null
                                      ? ` of ${coupon.usageLimit}`
                                      : ""}
                                  </div>
                                  {coupon.perUserLimit != null && (
                                    <div>
                                      Per user: {coupon.perUserLimit} max
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                      coupon.isActive
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {coupon.isActive ? "Active" : "Inactive"}
                                  </span>
                                  <div className="text-slate-500">
                                    {coupon.startsAt && (
                                      <div>
                                        From{" "}
                                        {new Date(
                                          coupon.startsAt
                                        ).toLocaleString()}
                                      </div>
                                    )}
                                    {coupon.endsAt && (
                                      <div>
                                        Until{" "}
                                        {new Date(
                                          coupon.endsAt
                                        ).toLocaleString()}
                                      </div>
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
                                      void handleToggleCouponActive(coupon)
                                    }
                                  >
                                    {coupon.isActive ? "Disable" : "Enable"}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete coupon {coupon.code}?
                                        </AlertDialogTitle>
                                      </AlertDialogHeader>
                                      <p className="text-sm text-muted-foreground">
                                        This will remove the coupon and any
                                        future redemptions will be blocked.
                                      </p>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            void handleDeleteCoupon(coupon.id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
                      disabled={loadingCoupons || couponState.page <= 1}
                      onClick={() => void loadCoupons(couponState.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        loadingCoupons || couponState.page >= totalCouponPages
                      }
                      onClick={() => void loadCoupons(couponState.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                  <span>
                    Page {couponState.page} of {totalCouponPages}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GiftIcon className="h-5 w-5 text-primary" />
                  Create offer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-title">Title</Label>
                  <Input
                    id="offer-title"
                    value={newOffer.title}
                    onChange={(e) =>
                      setNewOffer((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Flash sale"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="offer-description">Description</Label>
                  <Input
                    id="offer-description"
                    value={newOffer.description}
                    onChange={(e) =>
                      setNewOffer((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Visible to customers"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={newOffer.type}
                      onValueChange={(value) =>
                        setNewOffer((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FIXED">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target</Label>
                    <Select
                      value={newOffer.offType}
                      onValueChange={(value) =>
                        setNewOffer((prev) => ({ ...prev, offType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_PRODUCTS">
                          All products
                        </SelectItem>
                        <SelectItem value="CATEGORY">Category</SelectItem>
                        <SelectItem value="PRODUCT">
                          Product-level deal
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Discount value</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newOffer.value}
                      onChange={(e) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder={newOffer.type === "PERCENT" ? "10" : "500"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Discount type</Label>
                    <Select
                      value={newOffer.discountType}
                      onValueChange={(value) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          discountType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FLAT">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Max discount</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newOffer.maxDiscount}
                      onChange={(e) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          maxDiscount: e.target.value,
                        }))
                      }
                      placeholder="Optional cap"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={newOffer.priority}
                      onChange={(e) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Starts at</Label>
                    <Input
                      type="datetime-local"
                      value={newOffer.startsAt}
                      onChange={(e) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          startsAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ends at</Label>
                    <Input
                      type="datetime-local"
                      value={newOffer.endsAt}
                      onChange={(e) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          endsAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Category (optional)</Label>
                    <Select
                      value={newOffer.categoryId || "ALL_CATEGORIES"}
                      onValueChange={(value) =>
                        setNewOffer((prev) => ({
                          ...prev,
                          categoryId: value === "ALL_CATEGORIES" ? "" : value,
                        }))
                      }
                      disabled={loadingCategories || categories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_CATEGORIES">
                          All categories
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6 sm:mt-8">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Active</Label>
                      <Switch
                        checked={newOffer.isActive}
                        onCheckedChange={(checked) =>
                          setNewOffer((prev) => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label>Applies to all</Label>
                      <Switch
                        checked={newOffer.appliesToAll}
                        onCheckedChange={(checked) =>
                          setNewOffer((prev) => ({
                            ...prev,
                            appliesToAll: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    disabled={loadingOffers}
                    onClick={handleCreateOffer}
                  >
                    <GiftIcon className="h-4 w-4" />
                    Create offer
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Active offers and deals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-1.5">
                    <Label>Search</Label>
                    <Input
                      value={offerSearch}
                      onChange={(e) => setOfferSearch(e.target.value)}
                      placeholder="Search by title or description"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={offerStatus}
                      onValueChange={(value) =>
                        setOfferStatus(value as typeof offerStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target</Label>
                    <Select
                      value={offerTarget}
                      onValueChange={(value) =>
                        setOfferTarget(value as typeof offerTarget)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="ALL_PRODUCTS">
                          All products
                        </SelectItem>
                        <SelectItem value="CATEGORY">Category</SelectItem>
                        <SelectItem value="PRODUCT">Product deals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {offerState.offers.length} of {offerState.total}{" "}
                    offers
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loadingOffers}
                      onClick={() => void loadOffers(1)}
                    >
                      Apply filters
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={loadingOffers}
                      onClick={() => {
                        setOfferSearch("");
                        setOfferStatus("all");
                        setOfferTarget("all");
                        void loadOffers(1);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  {loadingOffers ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      Loading offers…
                    </div>
                  ) : offerState.offers.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      No offers found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-2 text-left">Title</th>
                            <th className="px-4 py-2 text-left">Details</th>
                            <th className="px-4 py-2 text-left">
                              Scope & deals
                            </th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offerState.offers.map((offer) => (
                            <tr
                              key={offer.id}
                              className="border-t text-slate-700 hover:bg-slate-50/80"
                            >
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold">
                                    {offer.title}
                                  </span>
                                  {offer.description && (
                                    <span className="text-xs text-muted-foreground">
                                      {offer.description}
                                    </span>
                                  )}
                                  {offer.category && (
                                    <span className="text-[11px] text-slate-500">
                                      Category: {offer.category.name}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs">
                                  <div>
                                    <span className="font-medium">
                                      {offer.type === "PERCENT"
                                        ? `${offer.value ?? 0}%`
                                        : `Rs ${offer.value ?? 0}`}
                                    </span>{" "}
                                    <span className="text-slate-500">
                                      ({offer.discountType})
                                    </span>
                                  </div>
                                  {offer.maxDiscount != null && (
                                    <div className="text-slate-500">
                                      Max discount: Rs{" "}
                                      {Number(offer.maxDiscount)}
                                    </div>
                                  )}
                                  <div className="text-slate-500">
                                    Priority: {offer.priority ?? 0}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs text-slate-500">
                                  <div>
                                    Target:{" "}
                                    {offer.offType === "ALL_PRODUCTS"
                                      ? "All products"
                                      : offer.offType === "CATEGORY"
                                      ? "Category"
                                      : "Product-level deals"}
                                  </div>
                                  {offer.appliesToAll && (
                                    <div>Applies to all items in scope</div>
                                  )}
                                  {offer.productOffers &&
                                    offer.productOffers.length > 0 && (
                                      <div>
                                        Linked deals:{" "}
                                        {offer.productOffers.length}
                                      </div>
                                    )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="space-y-1 text-xs">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                      offer.isActive
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {offer.isActive ? "Active" : "Inactive"}
                                  </span>
                                  <div className="text-slate-500">
                                    {offer.startsAt && (
                                      <div>
                                        From{" "}
                                        {new Date(
                                          offer.startsAt
                                        ).toLocaleString()}
                                      </div>
                                    )}
                                    {offer.endsAt && (
                                      <div>
                                        Until{" "}
                                        {new Date(
                                          offer.endsAt
                                        ).toLocaleString()}
                                      </div>
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
                                      void handleToggleOfferActive(offer)
                                    }
                                  >
                                    {offer.isActive ? "Disable" : "Enable"}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete offer {offer.title}?
                                        </AlertDialogTitle>
                                      </AlertDialogHeader>
                                      <p className="text-sm text-muted-foreground">
                                        This will remove the offer and any
                                        associated deals for future orders.
                                      </p>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            void handleDeleteOffer(offer.id)
                                          }
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
                      disabled={loadingOffers || offerState.page <= 1}
                      onClick={() => void loadOffers(offerState.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        loadingOffers || offerState.page >= totalOfferPages
                      }
                      onClick={() => void loadOffers(offerState.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                  <span>
                    Page {offerState.page} of {totalOfferPages}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
