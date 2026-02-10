"use client";

import { Pencil, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { use, useMemo, useState, Suspense } from "react";
import { toast } from "sonner";
import { getAllProductsForAdmin } from "@/actions/product/product";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { Product } from "@/shared/lib/generated/prisma/client";
import DeleteProductDialog from "./_components/delete-product-dialog";
import EditProductDialog from "./_components/edit-product-dialog";
import ToggleStock from "./_components/toggle-stock";

type ProductWithCategories = Product & {
  images: Array<{
    id: string;
    path: string;
    width: number | null;
    height: number | null;
  }>;
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
};

const initialProductsPromise = getAllProductsForAdmin();

export default function StoreManageProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading products...</div>}>
      <StoreManageProducts initialPromise={initialProductsPromise} />
    </Suspense>
  );
}

function StoreManageProducts({ initialPromise }: { initialPromise: Promise<any> }) {
  const result = use(initialPromise);
  const [products, setProducts] = useState<ProductWithCategories[]>(() => {
    return (result?.data as ProductWithCategories[]) || [];
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const currency = "Rs";

  const refreshProducts = async () => {
    try {
      const res = await getAllProductsForAdmin();
      if (res.data) setProducts(res.data as ProductWithCategories[]);
    } catch (error) {
      toast.error("Failed to refresh products");
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const matchTitle = product.title.toLowerCase().includes(query);
      const matchSku = product.sku?.toLowerCase().includes(query);
      const matchSlug = product.slug.toLowerCase().includes(query);
      const matchCategory = product.categories?.some((pc) =>
          pc.category.name.toLowerCase().includes(query)
      );
      return matchTitle || matchSku || matchSlug || matchCategory;
    });
  }, [products, searchQuery]);

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteProductId(id);
    setDeleteProductName(title);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (id: string) => {
    setEditProductId(id);
    setEditDialogOpen(true);
  };

  const onProductDelted = () => {
    setProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
    setDeleteDialogOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <p className="text-muted-foreground">
            View, edit, and manage your product inventory
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={refreshProducts} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border">
                        <Image
                          src={product.images[0]?.path || "/placeholder.png"}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {product.sku || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {currency} {product.basePrice}
                  </td>
                  <td className="px-6 py-4">
                     <ToggleStock product={product} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      product.visibility === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {product.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleEditClick(product.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDeleteClick(product.id, product.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editProductId && (
        <EditProductDialog
          productId={editProductId}
          open={editDialogOpen}
          setOpen={setEditDialogOpen}
          onSuccess={refreshProducts}
        />
      )}

      {deleteProductId && (
        <DeleteProductDialog
          productId={deleteProductId}
          productTitle={deleteProductName}
          open={deleteDialogOpen}
          setOpen={setEditDialogOpen}
          onSuccess={onProductDelted}
        />
      )}
    </div>
  );
}
