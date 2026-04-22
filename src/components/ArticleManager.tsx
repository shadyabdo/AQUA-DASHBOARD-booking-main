import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { Article } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Newspaper, Plus, Trash2, FileText, User, Calendar, Search, Edit2, Image as ImageIcon, Video, Tag } from 'lucide-react';
import { toast, confirm, default as MySwal } from '@/src/lib/swal';
import { ArticleForm } from './forms/ArticleForm';
import { motion, AnimatePresence } from 'framer-motion';

// RTL helper for SweetAlert2 popups
const applyRTL = (popup: HTMLElement) => {
  popup.style.direction = 'rtl';
  const els = popup.querySelectorAll<HTMLElement>('.swal2-title, .swal2-html-container, .swal2-content');
  els.forEach(el => { el.style.textAlign = 'center'; el.style.direction = 'rtl'; });
};

export const ArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'Articles'), orderBy('createdAt', 'desc'));
      const snapshot = await firestoreGetDocs(q);
      setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
    } catch (error) {
      console.error('Articles fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const openAddArticleSwal = () => {
    MySwal.fire({
      title: 'كتابة مقال جديد',
      html: (
        <div className="p-4">
          <ArticleForm 
            onSubmit={async (data) => {
              try {
                await addDoc(collection(db, 'Articles'), {
                  ...data,
                  createdAt: serverTimestamp()
                });
                toast.success('تم نشر المقال بنجاح');
                MySwal.close();
                fetchArticles();
              } catch (error) {
                console.error(error);
                toast.error('فشل في نشر المقال');
              }
            }}
            onCancel={() => MySwal.close()}
          />
        </div>
      ),
      showConfirmButton: false,
      width: '70vw',
      background: 'var(--card)',
      padding: 0,
      didOpen: (popup) => applyRTL(popup),
      customClass: {
        popup: 'rounded-[2.5rem] bg-card/95 backdrop-blur-2xl border-none shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden',
      }
    });
  };

  const openEditArticleSwal = (article: Article) => {
    MySwal.fire({
      title: 'تعديل المقال',
      html: (
        <div className="p-4">
          <ArticleForm 
            initialData={article}
            isEdit={true}
            onSubmit={async (data) => {
              try {
                await updateDoc(doc(db, 'Articles', article.id), data);
                toast.success('تم تحديث المقال بنجاح');
                MySwal.close();
                fetchArticles();
              } catch (error) {
                console.error(error);
                toast.error('فشل في تحديث المقال');
              }
            }}
            onCancel={() => MySwal.close()}
          />
        </div>
      ),
      showConfirmButton: false,
      width: '70vw',
      background: 'var(--card)',
      padding: 0,
      didOpen: (popup) => applyRTL(popup),
      customClass: {
        popup: 'rounded-[2.5rem] bg-card/95 backdrop-blur-2xl border-none shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden',
      }
    });
  };

  const handleDelete = async (article: Article) => {
    const ok = await confirm('حذف المقال', 'سيتم حذف هذا المقال نهائياً!');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'Articles', article.id));
      setArticles(prev => prev.filter(a => a.id !== article.id));
      toast.success('تم حذف المقال');
    } catch {
      toast.error('فشل في الحذف');
    }
  };

  const filtered = articles.filter(a =>
    (a['عنوان المقالة'] || a.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-right">
          <h1 className="text-4xl font-black text-text-main tracking-tight gradient-text">إدارة المقالات</h1>
          <p className="text-sm text-text-muted font-bold">نشر وتحرير المقالات التي تظهر للزوار في الموقع.</p>
        </div>
        <Button onClick={openAddArticleSwal} className="btn-premium h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20">
          <Plus className="h-5 w-5" />
          <span className="font-black text-xs uppercase tracking-widest">كتابة مقال جديد</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md ml-auto">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <Input
          placeholder="البحث في المقالات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-12 h-14 rounded-2xl bg-card border-border/40 text-right"
        />
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="premium-card h-80 animate-pulse bg-muted rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Newspaper className="h-16 w-16 text-text-muted/30 mb-4" />
          <p className="text-text-muted font-bold">لا توجد مقالات بعد</p>
          <p className="text-text-muted/60 text-sm">اضغط على "كتابة مقال جديد" لإضافة أول مقال</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((article) => {
            const title = article['عنوان المقالة'] || article.title || 'بدون عنوان';
            const content = article['محتوى المقالة'] || article.content || '';
            const image = article['صورة المقالة'] || article.image || '';
            const author = article['الكاتب'] || article.author || 'مجهول';
            const date = article['تاريخ المقالة'] || '';

            return (
              <div key={article.id} className="premium-card group overflow-hidden rounded-3xl hover:shadow-xl transition-all duration-300 flex flex-col text-right">
                {/* Image */}
                <div className="h-48 overflow-hidden relative bg-muted">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-text-muted/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {article['التصنيفات'] && article['التصنيفات'].length > 0 && (
                    <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5 flex-row-reverse">
                      {article['التصنيفات'].slice(0, 2).map((cat, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] font-black text-white uppercase tracking-wider">
                          {cat}
                        </span>
                      ))}
                      {article['التصنيفات'].length > 2 && (
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] font-black text-white">
                          +{article['التصنيفات'].length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-black text-lg text-text-main line-clamp-2 mb-2 group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-sm text-text-muted line-clamp-3 mb-4 flex-grow leading-relaxed">{content.replace(/<[^>]*>/g, '')}</p>

                  <div className="flex items-center justify-end gap-3 text-xs text-text-muted font-bold pt-4 border-t border-border/40 flex-row-reverse">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>{author}</span>
                    </div>
                    {date && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{date}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditArticleSwal(article)}
                      className="flex-1 h-10 rounded-xl hover:bg-primary/10 hover:text-primary gap-2"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> تعديل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(article)}
                      className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
