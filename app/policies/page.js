import { notFound } from "next/navigation";
import PolicyLayout from "../../Components/PolicyLayout.jsx";
import { getPolicyData } from "../../lib/policyData";

export default async function PoliciesPage() {
  const policyData = await getPolicyData();

  if (!policyData) {
    notFound();
  }

  const { paymentPolicy, privacyPolicy, termsAndConditions } = policyData.policy;

  return (
    <PolicyLayout logoPath={policyData.hotelLogo}>
      <div className="space-y-16">
        {/* Payment Policy */}
        <section>
          <h1 id="payment-policy" className="scroll-mt-32">Payment Policy</h1>
          <div
            dangerouslySetInnerHTML={{
              __html: paymentPolicy || "",
            }}
          />
        </section>

        {/* Privacy Policy */}
        <section>
          <h1 id="privacy-policy" className="scroll-mt-32">Privacy Policy</h1>
          <div
            dangerouslySetInnerHTML={{
              __html: privacyPolicy || "",
            }}
          />
        </section>

        {/* Terms and Conditions */}
        <section>
          <h1 id="terms-and-conditions" className="scroll-mt-32">Terms and Conditions</h1>
          <div
            dangerouslySetInnerHTML={{
              __html: termsAndConditions || "",
            }}
          />
        </section>
      </div>
    </PolicyLayout>
  );
}
