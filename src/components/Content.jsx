import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const sections = [
  {
    id: "sec-1",
    title: "Westphalia & Sovereignty",
    content: "The Westphalian concept visualization.\n\nUnderstand the origins of the modern state system and the birth of borderless finance."
  },
  {
    id: "sec-2",
    title: "Pillars of Governance",
    content: "The UN, WTO, and IMF serve as the three focal points of international cooperation.\n\nObserve how global trade routes are maintained."
  },
  {
    id: "sec-3",
    title: "The North-South Divide",
    content: "Explore the stark contrast in economic development.\n\nThe lighting shifts represent the persistent divide between the global north and south."
  },
  {
    id: "sec-4",
    title: "Contemporary Issues",
    content: "1. Digital Divide\n2. Geopolitical Instability\n3. Climate Change\n4. Economic Inequality\n5. Resource Scarcity"
  },
  {
    id: "sec-5",
    title: "Timeline 1945–Present",
    content: "1945: Post-War Order\n1989: Fall of the Wall\n2001: 9/11 Era\n2008: Financial Crisis\n2020: Global Pandemic"
  },
  {
    id: "sec-6",
    title: "Learning Hooks",
    content: "Thinking Questions:\n\nHow does capital flow influence sovereignty?\n\nWhat role do digital currencies play in the future?"
  }
];

export default function Content() {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('.panel-section');
      
      panels.forEach((panel, i) => {
        // Track active section for sidebar
        ScrollTrigger.create({
          trigger: panel,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveSection(i),
          onEnterBack: () => setActiveSection(i),
        });

        // The "Content Disappearing" Bug Fix -> Pinning
        // Pin the panel wrapper to keep it on screen with 150% VH breathing room
        ScrollTrigger.create({
          trigger: panel,
          start: "top top",
          end: "+=150%", // Gives the user breathing room to read before the next transition
          pin: true,
          pinSpacing: true, // This increases the scroll height dynamically
        });

        // Fade in/out the card inside the pinned section based on the scroll progress of the pin
        gsap.fromTo(panel.querySelector('.card-content'), 
          { opacity: 0, y: 50 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top top",
              end: "+=50%", // Finishes fading in early within the pin
              scrub: 1,
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollTo = (index) => {
    // Navigate using the ScrollTrigger pin start positions
    const panels = document.querySelectorAll('.panel-section');
    if (panels[index]) {
      const trigger = ScrollTrigger.getAll().find(t => t.pin === panels[index]);
      const targetPos = trigger ? trigger.start : panels[index].offsetTop;
      gsap.to(window, { duration: 1.5, scrollTo: targetPos, ease: "power3.inOut" });
    }
  };

  return (
    <div ref={containerRef} className="main-scroller relative z-10 w-full pointer-events-none">
      
      {/* Sidebar Dot Navigation */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-5 pointer-events-auto">
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`w-3 h-3 rounded-full transition-all duration-500 border border-gray-900 ${
              activeSection === i ? 'bg-gray-900 scale-150' : 'bg-transparent hover:bg-gray-900/30'
            }`}
            aria-label={`Jump to ${sec.title}`}
          />
        ))}
      </div>

      {sections.map((sec, index) => {
        // Layout alternations to map to 3D Earth movements
        let layoutClass = "justify-center text-center items-center"; // Sec 1 & 6 (Center)
        if (index === 1) layoutClass = "justify-center items-start pl-[10vw]"; // Sec 2 (Earth right, text left)
        if (index === 2) layoutClass = "justify-center items-end pr-[10vw]"; // Sec 3
        if (index === 3) layoutClass = "justify-center items-start pl-[10vw]"; // Sec 4 (Earth dark/glitchy)
        if (index === 4) layoutClass = "justify-center items-end pr-[15vw]"; // Sec 5 (Earth left, Timeline right)

        return (
          <section id={sec.id} key={sec.id} className={`panel-section h-screen w-full flex flex-col ${layoutClass}`}>
            <div className="card-content bg-white/10 backdrop-blur-md border border-white/20 p-10 md:p-14 rounded-3xl max-w-2xl mx-4 md:mx-0 pointer-events-auto shadow-2xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 font-serif font-bold mb-8 leading-tight tracking-tight drop-shadow-sm">
                {sec.title}
              </h2>
              <div className="text-lg md:text-xl text-gray-800 font-mono whitespace-pre-line leading-loose drop-shadow-sm">
                {sec.content}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
