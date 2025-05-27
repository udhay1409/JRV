import About from "../../Components/about/About.jsx";
import WhyChooseus from "../../Components/about/WhyChooseus";
import ExtraService from "@/Components/home/ExtraService";
import QuoteRequest from "../../Components/home/QuoteRequest";

import Testimonials from "../../Components/home/Testimonials.jsx" 

export default function Home() {
  return (
    <>
      <div className="">
        <About />
      </div>
     
      <div className="">
        <WhyChooseus />
      </div>
     
      <div className="">
        <ExtraService />
      </div>
      <div className="">
        <Testimonials />
      </div>
      <div className="">
        <QuoteRequest />
      </div>
    </>
  );
}
