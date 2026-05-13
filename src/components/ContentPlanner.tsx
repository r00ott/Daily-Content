import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Blog, Source, DailyTask, Pin } from "../types";
import { formatDate, cn } from "../lib/utils";
import { Plus, Sparkles, Pin as PinIcon, CheckCircle2, ChevronRight, BookOpen, Layout, ListOrdered, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ContentPlanner() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [activeBlogId, setActiveBlogId] = useState<string | null>(null);
  const [todayStr] = useState(formatDate(new Date()));
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubBlogs = onSnapshot(query(collection(db, "blogs"), where("userId", "==", auth.currentUser.uid)), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog));
      setBlogs(bList);
      if (bList.length > 0 && !activeBlogId) setActiveBlogId(bList[0].id);
    });
    
    const unsubSources = onSnapshot(query(collection(db, "sources"), where("userId", "==", auth.currentUser.uid)), (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Source)));
    });

    const unsubTasks = onSnapshot(query(collection(db, "tasks"), 
      where("date", "==", todayStr),
      where("userId", "==", auth.currentUser.uid)
    ), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyTask)));
    });

    return () => {
      unsubBlogs();
      unsubSources();
      unsubTasks();
    };
  }, [activeBlogId, todayStr]);

  const activeBlog = blogs.find(b => b.id === activeBlogId);
  const blogTasks = tasks.filter(t => t.blogId === activeBlogId);

  const addTask = async () => {
    if (!activeBlogId || !auth.currentUser) return;
    await addDoc(collection(db, "tasks"), {
      blogId: activeBlogId,
      date: todayStr,
      title: "New Article Draft",
      articleStatus: "pending",
      pins: [],
      userId: auth.currentUser.uid
    });
  };

  const generateResearch = async (task: DailyTask) => {
    if (!task.competitorUrl) {
       alert("Please link a competitor URL first.");
       return;
    }
    setLoadingAi(task.id);
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: task.competitorUrl, topic: task.title })
      });
      const data = await res.json();
      await updateDoc(doc(db, "tasks", task.id), {
        title: data.title,
        summary: data.summary,
        outline: data.outline,
        articleStatus: "drafted"
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(null);
    }
  };

  const generatePins = async (task: DailyTask) => {
    if (!task.summary || !task.title) return;
    setLoadingAi(task.id + "-pins");
    try {
      const res = await fetch("/api/ai/pinterest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title, summary: task.summary })
      });
      const data = await res.json();
      const newPins: Pin[] = data.pins.map((p: any) => ({ ...p, status: 'pending' }));
      await updateDoc(doc(db, "tasks", task.id), {
        pins: newPins
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(null);
    }
  };

  const togglePinStatus = async (task: DailyTask, pinIndex: number) => {
    const updatedPins = [...task.pins];
    updatedPins[pinIndex].status = updatedPins[pinIndex].status === 'posted' ? 'pending' : 'posted';
    await updateDoc(doc(db, "tasks", task.id), { pins: updatedPins });
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Daily Planner</h1>
          <p className="text-gray-500">Step-by-step workflow for your content production line.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
          {blogs.map(blog => (
            <button
              key={blog.id}
              onClick={() => setActiveBlogId(blog.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeBlogId === blog.id ? "bg-[#5A5A40] text-white" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {blog.name}
            </button>
          ))}
        </div>
      </header>

      {activeBlog ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif">Today's Pipeline ({blogTasks.length} / 3)</h2>
            {blogTasks.length < 3 && (
              <button 
                onClick={addTask}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#5A5A40] border border-[#5A5A40] rounded-xl hover:bg-[#5A5A40]/5 transition-colors font-bold text-sm"
              >
                <Plus className="w-4 h-4" /> Add Article Slot
              </button>
            )}
          </div>

          <div className="space-y-8">
            {blogTasks.map((task, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={task.id} 
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <input 
                      value={task.title}
                      onChange={(e) => updateDoc(doc(db, "tasks", task.id), { title: e.target.value })}
                      className="bg-transparent border-0 font-bold text-lg focus:ring-0 w-80 text-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                      task.articleStatus === 'posted' ? "bg-green-100 text-green-600" :
                      task.articleStatus === 'drafted' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {task.articleStatus}
                    </span>
                    <button onClick={() => deleteDoc(doc(db, "tasks", task.id))} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Left Column: Research & Draft */}
                  <div className="p-8 border-r border-gray-50 flex flex-col gap-8">
                    <section>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Step 1: Source Selection</label>
                      <select 
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm"
                        value={task.competitorUrl || ""}
                        onChange={(e) => updateDoc(doc(db, "tasks", task.id), { competitorUrl: e.target.value })}
                      >
                        <option value="">Select from Tracker...</option>
                        {sources.filter(s => s.blogId === activeBlogId).map(s => (
                          <option key={s.id} value={s.url}>{s.url}</option>
                        ))}
                      </select>
                    </section>

                    <section className="flex-1 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 2: AI Research & Draft</label>
                        <button 
                          disabled={loadingAi === task.id}
                          onClick={() => generateResearch(task)}
                          className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] hover:underline disabled:opacity-50"
                        >
                          {loadingAi === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Generate Summary & Outline
                        </button>
                      </div>
                      
                      {task.summary ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><BookOpen className="w-3 h-3"/> Summary</h4>
                            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{task.summary}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-2"><Layout className="w-3 h-3"/> Outline</h4>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{task.outline}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-2xl text-gray-300 text-sm italic">
                          Generated research will appear here
                        </div>
                      )}
                    </section>

                    <button 
                       onClick={() => updateDoc(doc(db, "tasks", task.id), { 
                         articleStatus: task.articleStatus === 'posted' ? 'drafted' : 'posted' 
                       })}
                       className={cn(
                         "mt-auto w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                         task.articleStatus === 'posted' 
                          ? "bg-green-500 text-white" 
                          : "bg-white border-2 border-gray-100 text-gray-400 hover:text-gray-900"
                       )}
                    >
                      {task.articleStatus === 'posted' ? <CheckSquare className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
                      {task.articleStatus === 'posted' ? "Article Posted" : "Mark as Posted"}
                    </button>
                  </div>

                  {/* Right Column: Pinterest Pins */}
                  <div className="p-8 bg-gray-50/30 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 3: Pinterest Automation</label>
                      <button 
                        disabled={!task.summary || loadingAi === (task.id + "-pins")}
                        onClick={() => generatePins(task)}
                        className="flex items-center gap-2 text-xs font-bold text-pink-600 hover:underline disabled:opacity-50"
                      >
                         {loadingAi === (task.id + "-pins") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                         Gen 3 Pin Ideas
                      </button>
                    </div>

                    <div className="space-y-4 flex-1">
                      {task.pins.length > 0 ? task.pins.map((pin, pIdx) => (
                        <div key={pIdx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative group">
                          <div className="flex items-start gap-3">
                            <PinIcon className="w-4 h-4 text-pink-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold text-gray-900 mb-1">{pin.idea}</p>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{pin.caption}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => togglePinStatus(task, pIdx)}
                            className={cn(
                              "w-full py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-2",
                              pin.status === 'posted' 
                                ? "bg-pink-100 border-pink-200 text-pink-600" 
                                : "bg-white border-gray-100 text-gray-400 hover:border-pink-200 hover:text-pink-600"
                            )}
                          >
                            {pin.status === 'posted' ? <CheckCircle2 className="w-3 h-3"/> : <Circle className="w-3 h-3"/>}
                            {pin.status === 'posted' ? "Pin Published" : "Publish Pin"}
                          </button>
                        </div>
                      )) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 text-sm text-center px-4 italic">
                          Article summary required before generating pins
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
           <p className="text-gray-400 mb-4 font-serif text-xl">Please configure at least one blog to get started.</p>
        </div>
      )}
    </div>
  );
}

import { Trash2, Circle } from "lucide-react";
