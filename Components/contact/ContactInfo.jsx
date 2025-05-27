import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactInfo = () => {
  return (
    <div className="bg-[#FFE9E9] p-6 md:p-8">
      <h2 className="text-3xl font-semibold mb-6 text-brand-dark">
        Contact With Us
      </h2>

      <p className="text-gray-600 mb-8">
        Whether you&apos;re planning a wedding, a grand event, or a special
        gathering, we&apos;re here to help you make it perfect. Connect with us
        today — let&apos;s bring your vision to life!
      </p>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-hotel-primary">
            <Phone size={20} />
          </div>
          <p className="text-gray-800 font-medium">+91 94896 04545</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-hotel-primary">
            <Mail size={20} />
          </div>
          <p className="text-gray-800 font-medium">vrj@gmail.com</p>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-hotel-primary mt-1">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-gray-800 font-medium">234, Main Rd,</p>
            <p className="text-gray-800 font-medium">Kallidaikurchi, Tamil</p>
            <p className="text-gray-800 font-medium">Nadu 627416</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
