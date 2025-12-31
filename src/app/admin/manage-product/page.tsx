import { getAllProducts } from "@/actions/product/product";
import Image from "next/image";

export default async function StoreManageProducts() {
  const currency = "Rs";
  const products = (await getAllProducts()).res;

  return (
    <>
      <h1 className="text-2xl text-slate-500 mb-5">
        Manage <span className="text-slate-800 font-medium">Products</span>
      </h1>
      <table className="w-full max-w-4xl text-left  ring ring-slate-200  rounded overflow-hidden text-sm">
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
          {products?.map((product) => {
            const productImage = product.images.find(
              (p) => p.isPrimary === true
            );
            return (
              <tr
                key={product.id}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <Image
                      className="w-14 h-14 p-1 shadow rounded cursor-pointer"
                      src={productImage?.path!}
                      alt={productImage?.altText!}
                      width={productImage?.width!}
                      height={productImage?.height!}
                    />
                    {product.title}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">
                  {product.description}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {currency} {product.mrp.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {currency} {product.price.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      onChange={() =>
                        toast.promise(toggleStock(product.id), {
                          loading: "Updating data...",
                        })
                      }
                      checked={product.inStock}
                    />
                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
