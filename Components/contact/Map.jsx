import React from "react";

const Map = () => {
  return (
    <div className="w-full h-[350px]">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.003127403296!2d77.46260199999999!3d8.691250999999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b04391870db47dd%3A0x9d6482c6dfa44eac!2sJRV%20MAHAL!5e0!3m2!1sen!2sin!4v1746250585364!5m2!1sen!2sin"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps"
      ></iframe>
    </div>
  );
};

export default Map;
