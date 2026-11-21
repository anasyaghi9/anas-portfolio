import Contact from '../components/Contact.jsx';
import Footer from '../components/Footer.jsx';
import Header from '../components/Header.jsx';
import { About, Certifications, Education, Hero, Projects, Services, Skills } from '../components/sections.jsx';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header onHome />
      <main>
        <Hero />
        <About />
        <Projects />
        <Services />
        <Skills />
        <Education />
        <Certifications />
        <Contact />
      </main>
      <Footer onHome />
    </div>
  );
}
