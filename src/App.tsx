import { ConvexProvider } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { convex } from "./lib/convexClient";
import Index from "./pages/Index";
import PlateBuilder from "./pages/PlateBuilder";
import PostMealFlow from "./pages/PostMealFlow";
import AdventureList from "./pages/AdventureList";
import InspirationMode from "./pages/InspirationMode";

const App = () => {
  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/build" element={<PlateBuilder />} />
          <Route path="/post-meal/:mealId" element={<PostMealFlow />} />
          <Route path="/adventure" element={<AdventureList />} />
          <Route path="/inspire" element={<InspirationMode />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  );
};

export default App;
