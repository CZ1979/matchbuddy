import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Games from "./pages/Games";
import NewGame from "./pages/NewGame";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/spiele" element={<Games />} />
        <Route path="/neues-spiel" element={<NewGame />} />
        <Route path="/profil" element={<Profile />} />
      </Route>
    </Routes>
  );
}
