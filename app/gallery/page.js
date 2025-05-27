import GalleryView from "../../Components/galleryPage/Gallery";

import QuoteRequest from "../../Components/home/QuoteRequest";

import Testimonials from "../../Components/home/Testimonials.jsx" 

export default function Home() {
  return (
    <>
      <div className="">
        <GalleryView />
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
