import ContactInfo from "./ContactInfo";
import ContactForm from "./ContactForm";
import Map from "./Map";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="h-[300px] relative flex items-center justify-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/banner/4.jpg")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl font-serif mb-4">CONTACT</h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>HOME</span>
            <span>/</span>
            <span>CONTACT</span>
          </div>
        </div>
      </div>
      <section className=" my-5">
        <div className="container mx-auto bg-[#FFE9E9] rounded-md shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 p-8">
            <ContactInfo />
            <ContactForm />
          </div>
        </div>
      </section>
      {/* Map Section */}
      <Map />
    </div>
  );
}
