import "./css/App.css";
import { Routes, Route } from 'react-router-dom';
import Navbar from "./components/NavBar";
import ScrollToTop from "./components/ScrollToTop";
import { AppProviders } from "./contexts/AppProviders";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetails from "./pages/MovieDetails";
import Watchlist from "./pages/Watchlist";
import Activity from "./pages/Activity";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AppProviders>
      <ScrollToTop />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </AppProviders>
  );
}

export default App;
