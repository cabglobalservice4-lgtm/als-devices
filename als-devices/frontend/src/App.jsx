import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Products from "./components/Products.jsx";
import Pro from "./components/Pro.jsx";
import { Trust, Categories, Promo, Contact, Footer } from "./components/Sections.jsx";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Trust />
        <Categories />
        <Promo />
        <Products />
        <Pro />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
