import "./css/App.css";
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/NavBar";
import ScrollToTop from "./components/ScrollToTop";
import { AppProviders } from "./contexts/AppProviders";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetails from "./pages/MovieDetails";
import Person from "./pages/Person";
import Watchlist from "./pages/Watchlist";
import Activity from "./pages/Activity";
import NotFound from "./pages/NotFound";

function App() {
  const location = useLocation();

  return (
    <AppProviders>
      <ScrollToTop />
      <Navbar />
      <main className="main-content">
        {/* Keying on pathname forces a remount per navigation (including
            in-route param changes, e.g. one movie's details to
            another's), which pairs with the .page-transition fade-in
            animation below for a lightweight, library-free page
            transition. */}
        <div key={location.pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/person/:id" element={<Person />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </AppProviders>
  );
}

export default App;
