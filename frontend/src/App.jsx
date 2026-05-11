import { HabitProvider } from "./store/habitStore";
import Home from "./pages/Home";

export default function App() {
  return (
    <HabitProvider>
      <Home />
    </HabitProvider>
  );
}
