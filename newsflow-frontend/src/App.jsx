import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateNews from "./pages/CreateNews";
import EditNews from "./pages/EditNews";
import Newspaper from "./pages/Newspaper";
import EditSubmission from "./pages/EditSubmission";
import EditPublished from "./pages/EditPublished";

function App() {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-news" element={<CreateNews />} />
      <Route path="/edit-news/:id" element={<EditNews />} />
      <Route path="/newspaper" element={<Navigate to="/newspaper/1" replace />} />
      <Route path="/newspaper/:page" element={<Newspaper />} />
      <Route path="/edit-submission/:id" element={<EditSubmission />} />
      <Route path="/edit-published/:id" element={<EditPublished />} />
    </Routes>
  );
}

export default App;