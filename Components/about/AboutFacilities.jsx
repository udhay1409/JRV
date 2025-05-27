import Image from "next/image";

const facilities = [
  {
    icon: "/icons/event-planning.png",
    title: "Event Planning & Coordination",
  },
  {
    icon: "/icons/stage-decoration.png",
    title: "Stage Decoration & Floral Arrangements",
  },
  {
    icon: "/icons/refreshment.png",
    title: "Refreshment and Beverags",
  },
  {
    icon: "/icons/photography.png",
    title: "Photography & Videography",
  },
  {
    icon: "/icons/sound-system-dj-setup.png",
    title: "Sound System & DJ Setup",
  },
  {
    icon: "/icons/valet-parking.png",
    title: "Valet Parking",
  },
];

export default function About() {
  return (
    <section className="bg-[#FFE9E9] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Image
              src="/icons/event-planning.png"
              alt="Crown"
              width={48}
              height={48}
              className="text-hotel-primary"
            />
          </div>
          <h2 className="text-3xl font-serif mb-4">
            Experience the JRV Mahal Advantage{" "}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From décor to dinner, we take care of it all.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {facilities.map((facility, index) => (
            <div
              key={index}
              className="group p-8 cursor-pointer transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 flex items-center justify-center mb-4">
                  <Image
                    src={facility.icon}
                    alt={facility.title}
                    width={40}
                    height={40}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-lg font-serif mb-2">{facility.title}</h3>
                <p className="text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {facility.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}