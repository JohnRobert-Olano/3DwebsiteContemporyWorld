import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const sections = [
  {
    id: "sec-1",
    title: "Culture",
    subTitle: "The Global Village",
    content: "Culture in the context of globalization refers to the movement and mixing of ideas, values, art, language, food, and lifestyle across national borders. It is the process by which people adopt, adapt, and exchange cultural expressions beyond their own society. Examples include the global spread of K-pop music, the worldwide popularity of Japanese anime, the dominance of Hollywood films, or the fact that English has become the default language of international business and academia. Globalization doesn't simply erase cultures — it blends them, creating new hybrid identities that are simultaneously local and global."
  },
  {
    id: "sec-2",
    title: "Economy",
    subTitle: "The Engine",
    content: "Economic globalization refers to the integration of national economies through trade, investment, supply chains, and financial markets into a single, interdependent global system. It is driven by transnational corporations (TNCs), free trade agreements, and foreign direct investment (FDI). Examples include a car assembled in Germany using steel from Brazil, microchips from Taiwan, and rubber from Malaysia — or a Filipino call center worker serving customers in the United States. The global economy means that a recession in one major country, a blocked shipping canal, or a new tariff policy can ripple across dozens of nations almost immediately."
  },
  {
    id: "sec-3",
    title: "Environment",
    subTitle: "The Shared Home",
    content: "Environmental globalization refers to the reality that ecological systems — air, oceans, climate, and biodiversity — do not respect national borders, making environmental challenges inherently global problems that require global solutions. It encompasses climate change, deforestation, ocean pollution, and the cross-border movement of environmental harm. For example, carbon emissions produced in industrialized nations raise sea levels that threaten Pacific Island communities, and plastic waste from one continent washes onto the beaches of another. The environment is the clearest proof that globalization is not just an economic or political phenomenon — it is a shared condition of human survival."
  },
  {
    id: "sec-4",
    title: "Politics",
    subTitle: "The Rules of the Game",
    content: "Political globalization refers to the development of international institutions, treaties, and agreements that govern how nations interact, cooperate, and resolve disputes. It includes bodies like the United Nations (UN), the World Trade Organization (WTO), and the International Monetary Fund (IMF), which set the rules for diplomacy, trade, and economic conduct. Examples include the Paris Climate Agreement, UN peacekeeping missions, or WTO trade dispute rulings between major economies. Essentially, political globalization is the attempt to manage a deeply interconnected world through shared rules — even when nations fundamentally disagree."
  },
  {
    id: "sec-5",
    title: "Technology",
    subTitle: "The Nervous System",
    content: "Technology refers to the tools, networks, and digital systems that connect the world and enable the near-instant flow of information, goods, and services across borders. It includes the internet, smartphones, artificial intelligence, and the physical infrastructure — like undersea cables and satellites — that keeps the global system running. For example, a video call between a student in the Philippines and a professor in the UK, or a payment sent from a worker abroad to their family back home in seconds, are both everyday acts of technological globalization. Without this sector, none of the others could function at their current speed or scale."
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

        // Pin the panel wrapper to keep it on screen with +350% VH breathing room
        ScrollTrigger.create({
          trigger: panel,
          start: "top top",
          end: "+=350%", 
          pin: true,
          pinSpacing: true,
        });

        // Strict Fade-in and Slide-up logic inside the 300% pin.
        const elements = panel.querySelectorAll('.anim-element');
        
        gsap.fromTo(elements, 
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            ease: "power2.out",
            stagger: 0.15,
            scrollTrigger: {
              trigger: panel,
              start: "top top",
              end: "+=50%",
              scrub: 1,
            }
          }
        );

        // Fade out before the pin ends
        gsap.to(elements, {
          opacity: 0,
          y: -30,
          ease: "power2.in",
          stagger: 0.1,
          scrollTrigger: {
            trigger: panel,
            start: "+=300%", // start fading out near the end of the 350% pin
            end: "+=350%",
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
        return (
          <section id={sec.id} key={sec.id} className="panel-section h-screen w-full flex flex-col justify-center items-start pl-12">
            {/* Safe-Zone Layout: Anchored to the left with padding, restricted to 40vw to avoid the 3D Earth */}
            <div className="card-content pointer-events-auto bg-black/40 backdrop-blur-md border border-[#0A6ED3]/30 p-8 md:p-10 rounded-3xl w-full max-w-[40vw] xl:max-w-xl shadow-2xl">
              <h2 className="anim-element font-sans text-4xl md:text-6xl text-white font-bold mb-2 uppercase tracking-tight leading-none drop-shadow-lg">
                {sec.title}
              </h2>
              {sec.subTitle && (
                <h3 
                  className="anim-element font-sans text-xl md:text-2xl text-[#0A6ED3] font-semibold mb-6 drop-shadow-md"
                >
                  {sec.subTitle}
                </h3>
              )}
              <div className="anim-element text-base md:text-lg text-gray-300 font-serif whitespace-pre-line leading-relaxed drop-shadow-sm">
                {sec.content}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
