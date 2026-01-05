import {
  getAdminDashboard,
  getStoreDashboard,
} from "@/actions/admin/dashboard";
import OrdersAreaChart from "@/shared/components/OrdersAreaChart";
import {
  CircleDollarSignIcon,
  ShoppingBasketIcon,
  StarIcon,
  TagsIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import ViewProduct from "./_components/view-product";
import ViewsReport from "./_components/views-report";

export default async function AdminDashboard() {
  const { data } = await getAdminDashboard();
  const { data: dashboardData } = await getStoreDashboard();
  console.log("admin dashboard: ", data);
  const cards = [
    {
      title: "Total Products",
      value: data?.products,
      icon: ShoppingBasketIcon,
    },
    {
      title: "Total Revenue",
      value: `Rs${data?.revenue}`,
      icon: CircleDollarSignIcon,
    },
    { title: "Total Orders", value: data?.orders, icon: TagsIcon },
    {
      title: "Total Ratings",
      value: dashboardData?.ratings.length,
      icon: StarIcon,
    },
  ];

  return (
    <section className="w-full min-h-screen flex flex-col items-start gap-6 sm:gap-10 py-14">
      <div className="w-full flex flex-col items-start text-foreground/80">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-6 sm:mb-10">
          Admin <span className="text-foreground font-medium">Dashboard</span>
        </h1>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 my-6 sm:my-10 mt-4 w-full">
          {cards?.map((card, index) => {
            const colors = [
              {
                bg: "bg-green-100",
                iconBg: "bg-green-700",
                iconColor: "text-white",
              },
              {
                bg: "bg-blue-100",
                iconBg: "bg-blue-700",
                iconColor: "text-white",
              },
              {
                bg: "bg-purple-100",
                iconBg: "bg-purple-700",
                iconColor: "text-white",
              },
              {
                bg: "bg-orange-100",
                iconBg: "bg-orange-700",
                iconColor: "text-white",
              },
            ];
            const color = colors[index % colors.length];
            return (
              <div
                key={index}
                className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between ${color.bg} p-4 sm:p-6 px-6 sm:px-8 rounded-xl shadow-sm`}
              >
                <div className="flex flex-col gap-2 sm:gap-4 text-sm">
                  <p className="text-slate-700">{card.title}</p>
                  <b className="text-2xl sm:text-3xl font-semibold text-slate-800">
                    {card.value}
                  </b>
                </div>
                <card.icon
                  size={60}
                  className={`w-12 h-12 sm:w-14 sm:h-14 p-2 sm:p-3 ${color.iconColor} ${color.iconBg} rounded-full mt-3 sm:mt-0`}
                />
              </div>
            );
          })}
        </div>

        {/* visits report */}
        <div className="w-full">
          <ViewsReport />
        </div>

        {/* Area Chart */}
        <div className="w-full mt-6 sm:mt-10">
          <OrdersAreaChart allOrders={data?.allOrders!} />
        </div>
      </div>
      <hr className="w-full" />
      <div className="text-foreground/80 mb-28 w-full">
        <h2 className="text-xl sm:text-2xl">Total Reviews</h2>

        <div className="mt-4 sm:mt-5 space-y-4 sm:space-y-0">
          {dashboardData?.ratings.map((review, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center justify-between py-4 sm:py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl"
            >
              <div className="w-full">
                <div className="flex gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="uppercase">
                      {(review?.user?.name as string)?.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {review.user?.name! as string}
                    </p>
                    <p className="font-light text-slate-500">
                      {new Date(review.createdAt as Date).toDateString()}
                    </p>
                  </div>
                </div>
                <p className="mt-2 sm:mt-3 text-slate-500 max-w-xs leading-6">
                  {review.comment}
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-4 sm:gap-6">
                <div className="flex flex-col sm:items-end">
                  {review.product?.categories.map((cat) => {
                    return (
                      <p key={cat.categoryId} className="text-slate-400">
                        {cat.categoryId}
                      </p>
                    );
                  })}
                  <p className="font-medium">
                    {review.product?.title as string}
                  </p>
                  <div className="flex items-center">
                    {Array(5)
                      .fill("")
                      .map((_, index) => (
                        <StarIcon
                          key={index}
                          size={17}
                          className="text-transparent mt-0.5"
                          fill={
                            review.rating >= index + 1 ? "#00C950" : "#D1D5DB"
                          }
                        />
                      ))}
                  </div>
                </div>
                <ViewProduct slug={review?.product?.slug!} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
