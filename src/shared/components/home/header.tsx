import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { SignedIn, SignedOut } from "../auth";
import UserButton from "../profile/user-btn";
import SearchInput from "../SearchInput";

const Header = () => {
  return (
    <header className=" top-0 sticky z-20 bg-card">
      <nav className="p-5 max-w-7xl mx-auto flex  justify-between items-center">
        <Link href={"/"}>
          <h1 className='logo small' aria-label='Resellify - brand'>
            <span className='mark' aria-hidden>
              R
            </span>
            <span className='word'>Resellify</span>
          </h1>
          {/* <picture>
            <source srcSet="/images/logo.svg" type="image/svg+xml" />
            <img src="/images/logo.png" width="180" alt="Resellify" />
          </picture> */}
        </Link>
        <div className="w-full flex items-center gap-5 justify-end">
          <SearchInput />
          <div className="hidden sm:flex gap-2">
            <Link
              href={"/bag"}
              className="min-w-20 flex items-center gap-2 text-sm"
            >
              <ShoppingBag size={14} />
              <span>My Bag</span>
            </Link>
            {/* <Link href={'/orders'} className='flex items-center gap-2 text-sm'>
            <List size={14} />
            <span>My Orders</span>
            </Link> */}
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Button size={"sm"} asChild>
              <Link href={"/auth/sign-in"}>Login</Link>
            </Button>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
};

export default Header;
