import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const sections = [
  {
    id: "sec-1",
    title: "Foundations of Modernity",
    content: "The Westphalian concept visualization.\n\nUnderstand the origins of the modern state system and the birth of borderless finance."
  },
  {
    id: "sec-2",
    title: "Pillars of Governance",
    content: "The UN, WTO, and IMF serve as the three focal points of international cooperation.\n\nObserve how global trade routes are maintained."
  },
  {
    id: "sec-3",
    title: "North-South Divide",
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

        // Pin the panel wrapper to keep it on screen with +200% VH breathing room
        ScrollTrigger.create({
          trigger: panel,
          start: "top top",
          end: "+=200%", 
          pin: true,
          pinSpacing: true,
        });

        // Strict Fade-in and Slide-up logic inside the 200% pin.
        // It enters from 0 to 30%, stays visible, then fades out from 70% to 100%
        // This ensures the previous one has faded out before the next pin starts scrolling in.
        const card = panel.querySelector('.card-content');
        
        gsap.fromTo(card, 
          { opacity: 0, y: 80 },
          { 
            opacity: 1, 
            y: 0, 
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top top",
              end: "+=50%",
              scrub: 1,
            }
          }
        );

        // Fade out before the pin ends
        gsap.to(card, {
          opacity: 0,
          y: -80,
          ease: "power2.in",
          scrollTrigger: {
            trigger: panel,
            start: "+=150%", // start fading out near the end of the 200% pin
            end: "+=200%",
            scrub: 1,
          }
        });

      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const scrollTo = (index) => {
    const panels = document.querySelectorAll('.panel-section');
    if (panels[index]) {
      const trigger = ScrollTrigger.getAll().find(t => t.pin === panels[index]);
      const targetPos = trigger ? trigger.start : panels[index].offsetTop;
      gsap.to(window, { duration: 1.5, scrollTo: targetPos, ease: "power3.inOut" });
    }
  };

  return (
    <div ref={containerRef} className="main-scroller relative z-10 w-full pointer-events-none font-sans">
      
      {/* Sidebar Dot Navigation */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-5 pointer-events-auto">
        {sections.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => scrollTo(i)}
            className={`w-3 h-3 rounded-full transition-all duration-500 border border-white/50 ${
              activeSection === i ? 'bg-white scale-150' : 'bg-transparent hover:bg-white/30'
            }`}
            aria-label={`Jump to ${sec.title}`}
          />
        ))}
      </div>

      {sections.map((sec, index) => {
        // Z-Index & Anti-Overlap Layout Management
        // We push the text to the extreme margins so the center (Earth) is a clear "safe zone".
        let layoutClass = "justify-end items-center pb-[10vh]"; // Sec 1 (Earth is distant center, Text Bottom)
        if (index === 1) layoutClass = "justify-center items-start pl-[5vw] md:pl-[10vw]"; // Sec 2 (Earth center/right, Text Left Margin)
        if (index === 2) layoutClass = "justify-end items-end pr-[5vw] md:pr-[15vw] pb-[10vh]"; // Sec 3 (Earth tilt center, Text Right/Bottom Margin)
        if (index === 3) layoutClass = "justify-center items-end pr-[5vw] md:pr-[10vw]"; // Sec 4 (Earth rotating fast, Text Right Margin)
        if (index === 4) layoutClass = "justify-center items-end pr-[10vw] md:pr-[15vw]"; // Sec 5 (Earth left, Text Right)
        if (index === 5) layoutClass = "justify-end items-center pb-[15vh]"; // Sec 6 (Earth zooming out, Text Bottom center)

        return (
          <section id={sec.id} key={sec.id} className={`panel-section h-screen w-full flex flex-col ${layoutClass}`}>
            {/* The Text Card (Glassmorphism + Cosmos Typography) */}
            <div className="card-content bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-3xl max-w-xl mx-4 md:mx-0 pointer-events-auto shadow-2xl">
              <h2 className="text-3xl md:text-5xl text-white font-bold mb-6 uppercase tracking-[0.15em] leading-tight drop-shadow-lg">
                {sec.title}
              </h2>
              <div className="text-base md:text-lg text-[#888888] font-light whitespace-pre-line leading-loose drop-shadow-sm">
                {sec.content}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
