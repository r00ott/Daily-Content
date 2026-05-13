import { useState, useEffect } from "react";
import { LayoutDashboard, Globe, Search, Calendar, CheckSquare, Plus, PenTool } from "lucide-react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import Dashboard from "./components/Dashboard";
import BlogSettings from "./components/BlogSettings";
import CompetitorTracker from "./components/CompetitorTracker";
import ContentPlanner from "./components/ContentPlanner";
import { cn } from "./lib/utils";

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [activeTab, setActiveTab] = useState<"dashboard" | "blogs" | "sources" | "planner">("dashboard");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <Globe className="w-12 h-12 text-[#5A5A40] mx-auto mb-6" />
          <h1 className="text-3xl font-serif mb-4">Daily Content Command</h1>
          <p className="text-gray-500 mb-8 font-sans">Streamline your blog and Pinterest content engine with AI-powered research and planning.</p>
          <button 
            onClick={login}
            className="w-full py-4 bg-[#5A5A40] text-white rounded-full font-medium hover:bg-[#4A4A30] transition-colors flex items-center justify-center gap-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#5A5A40]" />
            <span className="font-serif font-bold text-lg">Content Command</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === "planner"} 
            onClick={() => setActiveTab("planner")}
            icon={<Calendar className="w-5 h-5" />}
            label="Daily Planner"
          />
          <NavItem 
            active={activeTab === "sources"} 
            onClick={() => setActiveTab("sources")}
            icon={<Search className="w-5 h-5" />}
            label="Competitor Sources"
          />
          <NavItem 
            active={activeTab === "blogs"} 
            onClick={() => setActiveTab("blogs")}
            icon={<Globe className="w-5 h-5" />}
            label="My Blogs & Accounts"
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 p-2">
             <img src={user.photoURL || ""} className="w-8 h-8 rounded-full" />
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{user.displayName}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === "blogs" && <BlogSettings />}
          {activeTab === "sources" && <CompetitorTracker />}
          {activeTab === "planner" && <ContentPlanner />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
        active 
          ? "bg-[#5A5A40] text-white shadow-md shadow-[#5A5A40]/20" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
