import { redirect } from "next/navigation";

export default async function PaymentPolicyPage() {
  redirect('/policies#payment-policy');
}
