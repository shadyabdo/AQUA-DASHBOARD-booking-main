import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/lib/firebase';
import { Ad } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Megaphone, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, Edit2 } from 'lucide-react';
import { toast, confirm, default as MySwal } from '@/src/lib/swal';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

export const AdManager: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const q = query(collection(db, 'ads'), orderBy('title'));
        const snapshot = await firestoreGetDocs(q);
        setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
      } catch (error) {
        console.error("Ads fetch failed:", error);
      }
    };
    fetchAds();
  }, []);

  const openAddAdSwal = () => {
    let title = '';
    let imageUrl = '';
    let link = '';
    let isActive = true;

    MySwal.fire({
      title: 'إضافة إعلان جديد',
      html: (
        <div className="p-4 space-y-6 text-right" dir="rtl">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">عنوان الإعلان</Label>
            <Input 
              id="swal-ad-title"
              placeholder="مثال: خصم الصيف 50%..." 
              className="premium-input h-14 rounded-2xl text-base font-black px-6"
              onChange={(e) => { title = e.target.value; }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">رابط الصورة</Label>
            <Input 
              id="swal-ad-image"
              placeholder="https://example.com/ad.jpg" 
              className="premium-input h-14 rounded-2xl font-bold px-6"
              onChange={(e) => { imageUrl = e.target.value; }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">رابط خارجي (اختياري)</Label>
            <Input 
              id="swal-ad-link"
              placeholder="https://booking.com" 
              className="premium-input h-14 rounded-2xl font-bold px-6"
              onChange={(e) => { link = e.target.value; }}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
            <div className="flex items-center gap-3">
              <Switch id="swal-ad-active" defaultChecked={isActive} onCheckedChange={(val) => { isActive = val; }} />
              <Label htmlFor="swal-ad-active" className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">حالة النشاط</Label>
            </div>
            <Megaphone className="h-5 w-5 text-primary opacity-20" />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'نشر الإعلان',
      cancelButtonText: 'إلغاء',
      background: 'var(--card)',
      color: 'var(--text-main)',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.3)]',
        confirmButton: 'bg-primary text-white rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all',
        cancelButton: 'bg-muted text-text-main rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all',
      },
      preConfirm: async () => {
        if (!title.trim() || !imageUrl.trim()) {
          Swal.showValidationMessage('يرجى ملء كافة الحقول المطلوبة');
          return false;
        }
        try {
          await addDoc(collection(db, 'ads'), {
            title,
            imageUrl,
            link,
            isActive,
            createdAt: serverTimestamp()
          });
          return true;
        } catch (error) {
          MySwal.showValidationMessage('فشل في إضافة الإعلان');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('تمت إضافة الإعلان بنجاح');
      }
    });
  };

  const openEditAdSwal = (ad: Ad) => {
    let title = ad.title;
    let imageUrl = ad.imageUrl;
    let link = ad.link;
    let isActive = ad.isActive;

    MySwal.fire({
      title: 'تعديل الإعلان',
      html: (
        <div className="p-4 space-y-6 text-right" dir="rtl">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">عنوان الإعلان</Label>
            <Input 
              id="swal-edit-title"
              defaultValue={title}
              className="premium-input h-14 rounded-2xl text-base font-black px-6"
              onChange={(e) => { title = e.target.value; }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">رابط الصورة</Label>
            <Input 
              id="swal-edit-image"
              defaultValue={imageUrl}
              className="premium-input h-14 rounded-2xl font-bold px-6"
              onChange={(e) => { imageUrl = e.target.value; }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">رابط خارجي</Label>
            <Input 
              id="swal-edit-link"
              defaultValue={link}
              className="premium-input h-14 rounded-2xl font-bold px-6"
              onChange={(e) => { link = e.target.value; }}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
            <div className="flex items-center gap-3">
              <Switch id="swal-edit-active" defaultChecked={isActive} onCheckedChange={(val) => { isActive = val; }} />
              <Label htmlFor="swal-edit-active" className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">حالة النشاط</Label>
            </div>
            <Megaphone className="h-5 w-5 text-primary opacity-20" />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'حفظ التعديلات',
      cancelButtonText: 'إلغاء',
      background: 'var(--card)',
      color: 'var(--text-main)',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.3)]',
        confirmButton: 'bg-primary text-white rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all',
        cancelButton: 'bg-muted text-text-main rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all',
      },
      preConfirm: async () => {
        if (!title.trim() || !imageUrl.trim()) {
          Swal.showValidationMessage('يرجى ملء كافة الحقول المطلوبة');
          return false;
        }
        try {
          await updateDoc(doc(db, 'ads', ad.id), {
            title,
            imageUrl,
            link,
            isActive
          });
          return true;
        } catch (error) {
          MySwal.showValidationMessage('فشل في التحديث');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('تم تحديث الإعلان بنجاح');
      }
    });
  };

  const handleDeleteAd = async (id: string) => {
    const isConfirmed = await confirm('هل أنت متأكد؟', 'سيتم حذف هذا الإعلان نهائياً!');
    if (!isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'ads', id));
      toast.success('تم حذف الإعلان');
    } catch (error) {
      toast.error('فشل الحذف');
    }
  };

  const toggleStatus = async (ad: Ad) => {
    try {
      await updateDoc(doc(db, 'ads', ad.id), {
        isActive: !ad.isActive
      });
    } catch (error) {
      toast.error('فشل تحديث الحالة');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-text-main tracking-tight gradient-text">إدارة الإعلانات</h1>
          <p className="text-sm text-text-muted font-bold">إدارة المساحات الإعلانية والبنرات الترويجية الفاخرة.</p>
        </div>
        
        <Button 
          onClick={openAddAdSwal}
          className="btn-premium h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" />
          <span className="font-black text-xs uppercase tracking-widest">إضافة حملة إعلانية</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group"
            >
              <Card className="premium-card overflow-hidden h-full flex flex-col border-none shadow-premium hover:shadow-2xl transition-all duration-500">
                <div className="h-44 relative overflow-hidden">
                  <img 
                    src={ad.imageUrl} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  
                  <div className="absolute top-4 right-4">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border border-white/20",
                      ad.isActive ? "bg-success/80 text-white" : "bg-destructive/80 text-white"
                    )}>
                      {ad.isActive ? 'حملة نشطة' : 'متوقفة مؤقتاً'}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="space-y-1 max-w-[70%]">
                      <h3 className="font-black text-lg text-white line-clamp-1 leading-tight">{ad.title}</h3>
                      {ad.link && (
                        <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold">
                          <LinkIcon className="h-3 w-3" />
                          <span className="truncate">{ad.link}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(ad)}
                      className={cn(
                        "h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        ad.isActive ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-success/10 hover:text-success"
                      )}
                    >
                      {ad.isActive ? 'إيقاف البث' : 'تفعيل البث'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditAdSwal(ad)}
                      className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="h-10 w-10 rounded-xl text-text-muted hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {ads.length === 0 && (
          <div className="col-span-full py-40 text-center flex flex-col items-center gap-8 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/40">
            <div className="w-32 h-32 rounded-[2.5rem] bg-muted flex items-center justify-center">
              <Megaphone className="h-12 w-12 text-text-muted/20" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-black text-text-main">لا توجد حملات إعلانية</p>
              <p className="text-sm text-text-muted font-bold">ابدأ بإطلاق أول حملة ترويجية لزيادة المبيعات.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// Internal cn helper if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
