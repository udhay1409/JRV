import { Lato } from "next/font/google";
import "./globals.css";
import ClientProviders from "../Components/providers/ClientProviders";
import { getHotelDatabase } from "../utils/config/hotelConnection";
import { SeoSchema } from "../utils/model/webSettings/SeoSchema";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
});

async function getSeoData() {
  try {
    await getHotelDatabase();
    const seoData = await SeoSchema.findOne({});
    return seoData || {
      metaTitle: "Default Title",
      metaDescription: "Default Description",
      metaKeywords: "default, keywords"
    };
  } catch (error) {
    console.error("Error fetching SEO data:", error);
    return null;
  }
}

export async function generateMetadata() {
  const seoData = await getSeoData();
  
  return {
    title: seoData?.metaTitle || "Your App Name",
    description: seoData?.metaDescription || "Your app description for SEO purposes",
    keywords: seoData?.metaKeywords || "",
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${lato.className} template-color-1`}>
        <ClientProviders>
          {children}
        </ClientProviders> 
      </body>
    </html>
  );
}
