import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import SkeletonLoader from "./components/SkeletonLoader";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Import from "./pages/Import";
import ImportRayons from "./pages/ImportRayon";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Recipes from "./pages/Recipes";

function AppLayout() {
  const location = useLocation();
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userData, setUserData] = useState(null);
  const [household, setHousehold] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthUser(user);
    setAuthReady(true);
    if (!user) {
      setUserData(null);
      setHousehold(null);
    }
  }), []);

  useEffect(() => {
    if (!authUser) {
      return undefined;
    }

    return onSnapshot(doc(db, "users", authUser.uid), (snapshot) => {
      const profile = snapshot.exists()
        ? { ...snapshot.data(), uid: authUser.uid }
        : { uid: authUser.uid };
      setUserData(profile);
      setHousehold((current) =>
        profile.householdId && current?.id === profile.householdId ? current : null
      );
    });
  }, [authUser]);

  useEffect(() => {
    const householdId = userData?.householdId;
    if (!householdId) return undefined;

    return onSnapshot(doc(db, "households", householdId), (snapshot) => {
      setHousehold(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null);
    });
  }, [userData?.householdId]);

  const loginPage = location.pathname === "/login";
  const protectedPage = (page) => authUser ? page : <Navigate to="/login" replace />;

  if (!authReady) {
    return <div className="p-6 min-h-screen"><SkeletonLoader type="header" /></div>;
  }

  return (
    <main className="w-full max-w-[1400px] mx-auto relative min-h-screen pb-24">
      {authUser && !loginPage && <Header userData={userData} household={household} />}
      <div className={authUser && !loginPage ? "pt-20" : ""}>
        <Routes>
          <Route path="/login" element={authUser ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={protectedPage(<Home userData={userData} household={household} />)} />
          <Route path="/menu" element={protectedPage(<Menu />)} />
          <Route path="/cart" element={protectedPage(<Cart />)} />
          <Route path="/recipes" element={protectedPage(<Recipes userData={userData} />)} />
          <Route path="/import" element={protectedPage(<Import />)} />
          <Route path="/import-rayons" element={protectedPage(<ImportRayons />)} />
          <Route path="*" element={<Navigate to={authUser ? "/" : "/login"} replace />} />
        </Routes>
      </div>
      {authUser && !loginPage && <BottomNav />}
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
