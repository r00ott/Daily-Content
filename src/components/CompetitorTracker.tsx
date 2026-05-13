import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Blog, Source } from "../types";
import { Plus, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";

export default function CompetitorTracker() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [newSource, setNewSource] = useState({ url: "", blogId: "" });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubBlogs = onSnapshot(query(collection(db, "blogs"), where("userId", "==", auth.currentUser.uid)), (snap) => {
      setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog)));
    });
    const unsubSources = onSnapshot(query(collection(db, "sources"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc")), (snap) => {
      setSources(snap.docs.map(d => ({ id: d.id, ...d.data() } as Source)));
    });
    return () => {
      unsubBlogs();
      unsubSources();
    };
  }, []);

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.url || !newSource.blogId || !auth.currentUser) return;
    await addDoc(collection(db, "sources"), { 
      ...newSource, 
      status: "new", 
      createdAt: Date.now(),
      userId: auth.currentUser.uid
    });
    setNewSource({ url: "", blogId: "" });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-gray-900 mb-2">Competitor Sources</h1>
        <p className="text-gray-500">Track and organize competitor articles that inspire your content.</p>
      </header>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <form onSubmit={addSource} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="md:col-span-2 relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              placeholder="Competitor Article URL" 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
              value={newSource.url}
              onChange={e => setNewSource({ ...newSource, url: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <select 
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
              value={newSource.blogId}
              onChange={e => setNewSource({ ...newSource, blogId: e.target.value })}
            >
              <option value="">Target Blog...</option>
              {blogs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button className="px-6 bg-[#141414] text-white rounded-xl hover:bg-black font-medium transition-colors">
              Track
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
            <div className="col-span-6">Source URL</div>
            <div className="col-span-3 text-center">Assigned Blog</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1"></div>
          </div>

          {sources.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p>No competitor articles tracked yet.</p>
            </div>
          ) : sources.map(source => {
            const blog = blogs.find(b => b.id === source.blogId);
            return (
              <div key={source.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors group">
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 border border-gray-100">
                    <Globe className="w-4 h-4" />
                  </div>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 truncate hover:text-[#5A5A40] flex items-center gap-2">
                    {source.url}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
                <div className="col-span-3 text-center">
                  <span className="text-xs px-3 py-1 bg-white border border-gray-100 rounded-full text-gray-600 font-medium">
                    {blog?.name || 'Unknown'}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    source.status === 'new' ? "text-blue-500" :
                    source.status === 'processed' ? "text-green-500" : "text-gray-400"
                  )}>
                    {source.status}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button onClick={() => deleteDoc(doc(db, "sources", source.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { cn } from "../lib/utils";
