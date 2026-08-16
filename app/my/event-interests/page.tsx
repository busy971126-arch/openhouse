import { redirect } from "next/navigation";

export default function MyEventInterestsRedirectPage() {
  redirect("/my/interests?tab=events");
}
