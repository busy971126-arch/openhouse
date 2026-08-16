import { redirect } from "next/navigation";

export default function MyWishlistRedirectPage() {
  redirect("/my/interests?tab=gyms");
}
