import { redirect } from "next/navigation";

export default async function TermsPage() {
  redirect("/policies#terms-and-conditions");
}
