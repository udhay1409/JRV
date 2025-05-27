const defaultPolicyData = {
  paymentPolicy: `
PAYMENT TERMS:
We accept various payment methods including credit cards, debit cards, and bank transfers. To secure your booking, we require:

- 50% advance payment at the time of booking
- Remaining balance due 7 days before the event
- Security deposit of ₹10,000 (refundable)

CANCELLATION POLICY:
Our cancellation policy is designed to be fair to all parties:

- Cancellation 30+ days before: Full refund minus processing fees
- Cancellation 15-29 days before: 50% refund
- Cancellation 7-14 days before: 25% refund
- Cancellation less than 7 days before: No refund

REFUND PROCESS:
- Refunds are processed within 7-10 business days
- Transaction fees are non-refundable
- Refunds will be made to the original payment method

ADDITIONAL CHARGES:
- Overtime charges apply beyond booked hours
- Additional services requested during the event will be charged extra
- Damage to property will be deducted from the security deposit`,

  privacyPolicy: `
INFORMATION COLLECTION:
We collect information that you provide directly to us, including:

- Personal identification information
- Contact information
- Payment details
- Event requirements and preferences

DATA USAGE:
Your information helps us provide and improve our services:

- Process your bookings and payments
- Communicate about your events
- Improve our facilities and services
- Send relevant updates and offers

DATA PROTECTION:
We implement various security measures to maintain the safety of your personal information:

- Secure data encryption
- Regular security audits
- Limited staff access to personal data
- Secure physical storage of documents

YOUR RIGHTS:
You have the right to:

- Access your personal data
- Request data correction
- Opt-out of marketing communications
- Request data deletion`,

  termsAndConditions: `
BOOKING TERMS:
By booking our venue, you agree to:

- Provide accurate booking information
- Follow venue capacity limits
- Adhere to noise regulations
- Respect property and equipment

VENUE RULES:
All guests must comply with:

- No smoking inside the venue
- No unauthorized decorations
- Proper parking in designated areas
- Security check procedures

LIABILITY:
The venue is not responsible for:

- Personal belongings
- Third-party vendor services
- Weather-related issues
- Force majeure events

GENERAL CONDUCT:
We expect all guests to:

- Maintain appropriate behavior
- Follow safety guidelines
- Respect other guests
- Comply with staff instructions`
};

export async function getPolicyData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/settings/policy`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
      credentials: 'include',
    });    if (!response.ok) {
      console.error('Policy API response:', {
        status: response.status,
        statusText: response.statusText,
      });
      return {
        policy: defaultPolicyData,
        hotelLogo: '/logo-mahaal.png'
      };
    }

    const data = await response.json();
      // Use default data if API data is invalid or missing
    const policyData = (data.success && data.policy) ? data.policy : defaultPolicyData;
    const hotelLogo = (data.success && data.hotelLogo) ? data.hotelLogo : '/logo-mahaal.png';

    // Format the policy content with proper headings and sections
    const formattedPolicy = {
      ...policyData,
      paymentPolicy: formatPolicyContent(policyData.paymentPolicy),
      privacyPolicy: formatPolicyContent(policyData.privacyPolicy),
      termsAndConditions: formatPolicyContent(policyData.termsAndConditions)
    };

    return {
      policy: formattedPolicy,
      hotelLogo: hotelLogo
    };
    
  } catch (error) {    console.error('Error fetching policy data:', error);
    return {
      policy: defaultPolicyData,
      hotelLogo: '/logo-mahaal.png'
    };
  }
}

function formatPolicyContent(content) {
  if (!content) return '';

  // Split content into sections based on headings
  const sections = content.split(/(?=\n[A-Z][^a-z\n]*:)/);

  return sections.map(section => {
    // Extract heading and content
    const [heading, ...contentParts] = section.trim().split('\n');
    const sectionContent = contentParts.join('\n').trim();

    if (!heading || !sectionContent) return section;

    // Clean up the heading
    const cleanHeading = heading.replace(':', '').trim();
    
    // Convert heading to ID
    const headingId = cleanHeading.toLowerCase().replace(/\s+/g, '-');

    // Format the content with paragraphs and lists
    const formattedContent = sectionContent
      .split('\n\n')
      .map(paragraph => {
        // Check if it's a list
        if (paragraph.includes('\n- ')) {
          const listItems = paragraph
            .split('\n- ')
            .filter(item => item.trim())
            .map(item => `<li>${item.trim()}</li>`)
            .join('');
          return `<ul>${listItems}</ul>`;
        }
        
        // Regular paragraph
        return `<p>${paragraph.trim()}</p>`;
      })
      .join('\n');

    // Return formatted section with proper heading
    return `
      <section>
        <h2 id="${headingId}">${cleanHeading}</h2>
        ${formattedContent}
      </section>
    `.trim();
  }).join('\n\n');
}
