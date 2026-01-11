import { getAllProducts } from "@/actions/product/product";
import Image from "next/image";
import { toast } from "sonner";
import ToggleStock from "./_components/toggle-stock";

export const revalidate = 0;

export default async function StoreManageProducts() {
  const currency = "Rs";

  const products = (await getAllProducts()).res;

  return (
    <section className="py-6">
      <h1 className="text-4xl text-slate-500 mb-5">
        Manage <span className="text-slate-800 font-medium">Products</span>
      </h1>
      <table className="w-full text-left  ring ring-slate-200  rounded overflow-hidden text-sm">
        <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 hidden md:table-cell">Description</th>
            <th className="px-4 py-3 hidden md:table-cell">MRP</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {products &&
            products?.map((product) => (
              <tr
                key={product.id}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    {product.images && product.images.length > 0 && (
                      <Image
                        className="w-14 h-14 p-1 shadow rounded cursor-pointer"
                        src={product.images[0].path}
                        alt={product.title}
                        width={product?.images[0].width!}
                        height={product?.images[0].height!}
                      />
                    )}
                    {product.title}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">
                  {product.description || product.shortDescription}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {currency} {product?.salePrice?.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {currency} {product.basePrice.toLocaleString()}
                </td>
                <ToggleStock product={product} />
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}
