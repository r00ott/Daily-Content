import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Blog, DailyTask } from "../types";
import { formatDate } from "../lib/utils";
import { CheckCircle2, Circle, Clock, FileText, Share2 } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: any) => void }) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const blogsQuery = query(collection(db, "blogs"), 
      where("status", "==", "active"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubBlogs = onSnapshot(blogsQuery, (snap) => {
      setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog)));
    });

    const todayStr = formatDate(new Date());
    const tasksQuery = query(collection(db, "tasks"), 
      where("date", "==", todayStr),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      setTodayTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyTask)));
      setLoading(false);
    });

    return () => {
      unsubBlogs();
      unsubTasks();
    };
  }, []);

  const stats = [
    { label: "Today's Target", value: blogs.length * 3, icon: <FileText className="w-5 h-5" />, color: "bg-blue-50 text-blue-600" },
    { label: "Drafted", value: todayTasks.filter(t => t.articleStatus === 'drafted').length, icon: <Clock className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
    { label: "Posted", value: todayTasks.filter(t => t.articleStatus === 'posted').length, icon: <CheckCircle2 className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
    { label: "Pins Planned", value: todayTasks.reduce((acc, t) => acc + t.pins.length, 0), icon: <Share2 className="w-5 h-5" />, color: "bg-pink-50 text-pink-600" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-gray-900 mb-2">Morning Overview</h1>
        <p className="text-gray-500">Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.color)}>
              {stat.icon}
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif">Today's Progress</h2>
            <button onClick={() => setActiveTab("planner")} className="text-sm text-[#5A5A40] font-medium hover:underline">View Planner</button>
          </div>

          <div className="space-y-6">
            {blogs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                <Globe className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No blogs configured yet.</p>
                <button onClick={() => setActiveTab("blogs")} className="mt-4 text-sm text-[#5A5A40] font-bold">Add your first blog</button>
              </div>
            ) : blogs.map(blog => {
              const blogTasks = todayTasks.filter(t => t.blogId === blog.id);
              return (
                <div key={blog.id} className="pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">{blog.name}</h3>
                    <span className="text-xs font-mono text-gray-400">{blogTasks.length} / 3 Daily Articles</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => {
                      const task = blogTasks[i-1];
                      const status = task ? task.articleStatus : 'none';
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "h-2 flex-1 rounded-full",
                            status === 'posted' ? "bg-green-500" :
                            status === 'drafted' ? "bg-amber-400" :
                            status === 'pending' ? "bg-blue-400" : "bg-gray-100"
                          )} 
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#141414] text-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-serif mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <ActionButton 
              icon={<Search />} 
              label="Track New Source" 
              onClick={() => setActiveTab("sources")} 
            />
            <ActionButton 
              icon={<PenTool />} 
              label="Plan Today's Article" 
              onClick={() => setActiveTab("planner")} 
            />
            <ActionButton 
              icon={<Plus />} 
              label="Add New Blog" 
              onClick={() => setActiveTab("blogs")} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors text-left group"
    >
      <div className="p-2 bg-white/10 rounded-lg group-hover:bg-[#5A5A40] transition-colors">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

import { cn } from "../lib/utils";
