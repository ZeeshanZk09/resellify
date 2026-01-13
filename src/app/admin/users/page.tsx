import { redirect } from "next/navigation";
import { toast } from "sonner";
import { getUsers } from "@/actions/admin/users";
import { auth } from "@/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Card } from "@/shared/components/ui/card";
import { UserActiveToggle } from "./_components/toggle-active";

export default async function Users() {
  const session = await auth();
  const data = await getUsers();
  console.log("admin-users", data);

  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  if (!data.users) {
    toast.error(data.message);
  }

  console.log(data);
  return (
    <div className="p-0 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.users && data.users.length > 0 ? (
          data.users.map((user) => (
            <Card key={user.id} className="p-4">
              <Avatar className="size-9">
                <AvatarFallback className="uppercase">
                  {(user?.name as string)?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-semibold">{user.name} </h2>
              {/* In-active a user */}
              {session?.user.email !== user.email && (
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Active</p>
                  <UserActiveToggle
                    userId={user.id}
                    key={user.id}
                    isActive={!!user.isActive}
                  />
                  {/* <label className='relative inline-flex items-center cursor-pointer text-gray-900'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    // onChange={() =>
                    //   toast.promise(() => toggleIsActive(store.id!), {
                    //     loading: 'Updating data...',
                    //   })
                    // }
                    // checked={store.isActive}
                  />
                  <div className='w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200'></div>
                  <span className='dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4'></span>
                </label> */}
                </div>
              )}
              <p className="text-sm text-gray-600">Email: {user.email}</p>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
            </Card>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
}
