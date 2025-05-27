import Home from "../Components/home/Home";
import About from "../Components/home/About";
import Facilities from "../Components/home/Facilities";
import HotelFacilities from "../Components/home/HotelFacilities";
import RoomFacilities from "../Components/home/RoomFacilities";
import ExtraService from "../Components/home/ExtraService";
import Testimonials from "../Components/home/Testimonials";
import QuoteRequest from "../Components/home/QuoteRequest";

import AboutFacilities from "../Components/about/AboutFacilities.jsx";


export default function Page() {
  return (
    <section>
      <Home />
      <About />
      <Facilities />
      <HotelFacilities />
      <RoomFacilities />
      <AboutFacilities />
      <ExtraService />
      <Testimonials />
      <QuoteRequest />
    </section>
  );
}