import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Newspaper, User, Calendar, Image as ImageIcon, Video, Plus, Trash2, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from '@/src/types';
import { cn } from '@/lib/utils';

interface ArticleFormProps {
  initialData?: Partial<Article>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const ArticleForm: React.FC<ArticleFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.['عنوان المقالة'] || initialData?.title || '',
    content: initialData?.['محتوى المقالة'] || initialData?.content || '',
    image: initialData?.['صورة المقالة'] || initialData?.image || '',
    author: initialData?.['الكاتب'] || initialData?.author || '',
    date: initialData?.['تاريخ المقالة'] || initialData?.date || new Date().toLocaleDateString('ar-EG'),
    categories: initialData?.['التصنيفات'] || []
  });

  const [submitting, setSubmitting] = useState(false);

  const addCategory = () => {
    setFormData(prev => ({ ...prev, categories: [...prev.categories, ''] }));
  };

  const updateCategory = (index: number, val: string) => {
    const newCats = [...formData.categories];
    newCats[index] = val;
    setFormData(prev => ({ ...prev, categories: newCats }));
  };

  const removeCategory = (index: number) => {
    setFormData(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== index) }));
  };

  const insertMedia = (type: 'image' | 'video') => {
    const url = window.prompt(type === 'image' ? 'أدخل رابط الصورة (URL):' : 'أدخل رابط فيديو اليوتيوب:');
    if (!url) return;

    let embedCode = '';
    if (type === 'image') {
      embedCode = `\n<img src="${url}" class="w-full rounded-2xl my-4 shadow-md" alt="صورة توضيحية" />\n`;
    } else {
      let embedUrl = url;
      if (url.includes('youtube.com/watch?v=')) {
        embedUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/').split('&')[0];
      } else if (url.includes('youtu.be/')) {
        embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0];
      }
      embedCode = `\n<iframe class="w-full aspect-video rounded-2xl my-4 shadow-md" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n`;
    }

    const textarea = document.getElementById('article-content-area') as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, startPos) + embedCode + text.substring(endPos);
      setFormData({ ...formData, content: newText });
      
      // We can't easily set selection after re-render without a ref/useEffect, 
      // but this is enough for the user's manual update.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit({
        'عنوان المقالة': formData.title,
        'محتوى المقالة': formData.content,
        'صورة المقالة': formData.image,
        'الكاتب': formData.author,
        'تاريخ المقالة': formData.date,
        'التصنيفات': formData.categories.filter(c => c.trim() !== '')
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-right space-y-8 max-h-[75vh] overflow-y-auto px-4 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">هوية المقال</Label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              className="premium-input h-14 rounded-2xl text-base font-black px-6"
              placeholder="عنوان المقال..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">الكاتب</Label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <Input 
                  value={formData.author} 
                  onChange={(e) => setFormData({...formData, author: e.target.value})} 
                  className="premium-input h-12 pr-12 rounded-xl font-bold"
                  placeholder="اسم الكاتب..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">التاريخ</Label>
              <div className="relative group">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <Input 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  className="premium-input h-12 pr-12 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">رابط الصورة الرئيسية</Label>
            <div className="relative group">
              <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
              <Input 
                value={formData.image} 
                onChange={(e) => setFormData({...formData, image: e.target.value})} 
                className="premium-input h-12 pr-12 rounded-xl font-bold"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">التصنيفات</Label>
          <div className="bg-muted/20 p-6 rounded-[2rem] border border-border/40 space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
               <AnimatePresence>
                {formData.categories.map((cat, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 bg-card border border-border/60 rounded-xl pl-2 pr-4 py-2 shadow-sm group"
                  >
                    <Input 
                      value={cat} 
                      onChange={(e) => updateCategory(index, e.target.value)}
                      className="border-none bg-transparent h-6 p-0 text-xs font-bold focus-visible:ring-0 w-24"
                      placeholder="تصنيف..."
                    />
                    <button type="button" onClick={() => removeCategory(index)} className="text-text-muted hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addCategory}
              className="w-full h-12 border-dashed border-2 border-primary/20 text-[10px] font-black rounded-xl hover:bg-primary/5 hover:border-primary/40 text-primary transition-all flex-row-reverse gap-2"
            >
              <Plus className="h-4 w-4" /> إضافة تصنيف جديد
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center mb-2 flex-row-reverse">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">محتوى المقالة</Label>
          <div className="flex gap-2">
            <button type="button" onClick={() => insertMedia('image')} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-bold transition-colors">
              <ImageIcon className="w-3.5 h-3.5" /> أضف صورة
            </button>
            <button type="button" onClick={() => insertMedia('video')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-[10px] font-bold transition-colors">
              <Video className="w-3.5 h-3.5" /> أضف فيديو
            </button>
          </div>
        </div>
        <textarea
          id="article-content-area"
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          className="w-full premium-input rounded-3xl text-sm font-bold p-8 min-h-[350px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed text-right"
          placeholder="ابدأ بسرد قصتك هنا..."
        />
      </div>

      <div className="pt-6 flex items-center justify-end gap-4 border-t border-border/40">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-14 px-10 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
          إلغاء الأمر
        </Button>
        <Button 
          type="submit" 
          disabled={submitting} 
          className="btn-premium h-14 px-16 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30"
        >
          {submitting ? 'جاري الحفظ...' : (isEdit ? 'تحديث المقال' : 'نشر المقال')}
        </Button>
      </div>
    </form>
  );
};
