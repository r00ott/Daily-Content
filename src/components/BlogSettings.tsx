import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Blog, PinterestAccount } from "../types";
import { Plus, Trash2, Globe, Hash } from "lucide-react";
import { OperationType, handleFirestoreError, auth as firebaseAuth } from "../lib/firebase";

export default function BlogSettings() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pins, setPins] = useState<PinterestAccount[]>([]);
  const [newBlog, setNewBlog] = useState({ name: "", url: "" });
  const [newPin, setNewPin] = useState({ name: "", handle: "", blogId: "" });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubBlogs = onSnapshot(query(collection(db, "blogs"), where("userId", "==", auth.currentUser.uid)), (snap) => {
      setBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Blog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "blogs"));

    const unsubPins = onSnapshot(query(collection(db, "pinterestAccounts"), where("userId", "==", auth.currentUser.uid)), (snap) => {
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() } as PinterestAccount)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "pinterestAccounts"));

    return () => {
      unsubBlogs();
      unsubPins();
    };
  }, []);

  const addBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlog.name || !newBlog.url || !auth.currentUser) return;
    try {
      await addDoc(collection(db, "blogs"), { ...newBlog, status: "active", userId: auth.currentUser.uid });
      setNewBlog({ name: "", url: "" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "blogs");
    }
  };

  const addPinterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.name || !newPin.blogId || !auth.currentUser) return;
    try {
      await addDoc(collection(db, "pinterestAccounts"), { ...newPin, userId: auth.currentUser.uid });
      setNewPin({ name: "", handle: "", blogId: "" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "pinterestAccounts");
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      await deleteDoc(doc(db, "blogs", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `blogs/${id}`);
    }
  };

  const deletePin = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pinterestAccounts", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pinterestAccounts/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-serif text-gray-900 mb-2">Blogs & Accounts</h1>
        <p className="text-gray-500">Manage your 3 blogs and their respective Pinterest profiles.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#5A5A40]" />
            Managed Blogs
          </h2>
          
          <form onSubmit={addBlog} className="mb-8 flex gap-3">
            <input 
              placeholder="Blog Name" 
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
              value={newBlog.name}
              onChange={e => setNewBlog({ ...newBlog, name: e.target.value })}
            />
            <input 
              placeholder="URL" 
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
              value={newBlog.url}
              onChange={e => setNewBlog({ ...newBlog, url: e.target.value })}
            />
            <button className="p-2 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4A4A30]">
              <Plus />
            </button>
          </form>

          <div className="space-y-4">
            {blogs.map(blog => (
              <div key={blog.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-gray-900">{blog.name}</p>
                  <p className="text-xs text-gray-500">{blog.url}</p>
                </div>
                <button onClick={() => deleteBlog(blog.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#5A5A40]" />
            Pinterest Profiles
          </h2>

          <form onSubmit={addPinterest} className="mb-8 space-y-3">
             <div className="flex gap-3">
                <input 
                  placeholder="Profile Name" 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  value={newPin.name}
                  onChange={e => setNewPin({ ...newPin, name: e.target.value })}
                />
                <input 
                  placeholder="@handle" 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  value={newPin.handle}
                  onChange={e => setNewPin({ ...newPin, handle: e.target.value })}
                />
             </div>
             <div className="flex gap-3">
               <select 
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  value={newPin.blogId}
                  onChange={e => setNewPin({ ...newPin, blogId: e.target.value })}
               >
                 <option value="">Link to Blog...</option>
                 {blogs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
               </select>
               <button className="px-6 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4A4A30]">
                 Add Profile
               </button>
             </div>
          </form>

          <div className="space-y-4">
            {pins.map(pin => {
              const blog = blogs.find(b => b.id === pin.blogId);
              return (
                <div key={pin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">{pin.name}</p>
                    <p className="text-xs text-[#5A5A40] font-medium">{blog?.name || 'Unlinked'}</p>
                  </div>
                  <button onClick={() => deletePin(pin.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section> section
      </div>
    </div>
  );
}
