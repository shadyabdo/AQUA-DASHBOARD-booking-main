import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Coupon } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Ticket, Plus, Trash2, Calendar, Percent, CheckCircle2, XCircle, X, Edit2, Zap } from 'lucide-react';
import { toast, confirm, default as MySwal } from '@/src/lib/swal';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const q = query(collection(db, 'coupons'), orderBy('code'));
        const snapshot = await firestoreGetDocs(q);
        setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
      } catch (error) {
        console.error("Coupons fetch failed:", error);
      }
    };
    fetchCoupons();
  }, []);

  const openAddCouponSwal = () => {
    let code = '';
    let title = '';
    let description = '';
    let discountPercentage = '';
    let expiryDate = '';
    let isActive = true;

    MySwal.fire({
      title: 'إصدار كوبون جديد',
      html: (
        <div className="p-4 space-y-6 text-right" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">كود الخصم</Label>
              <Input 
                id="swal-coupon-code"
                placeholder="RAMADAN2026" 
                className="premium-input h-14 rounded-2xl text-base font-black px-6 uppercase"
                onChange={(e) => { code = e.target.value; }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">عنوان العرض</Label>
              <Input 
                id="swal-coupon-title"
                placeholder="خصم رمضان المبارك" 
                className="premium-input h-14 rounded-2xl font-bold px-6"
                onChange={(e) => { title = e.target.value; }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">وصف العرض (يظهر في الموقع)</Label>
            <Input 
              id="swal-coupon-desc"
              placeholder="استمتع بخصم إضافي عند الحجز في شهر رمضان..." 
              className="premium-input h-14 rounded-2xl font-bold px-6"
              onChange={(e) => { description = e.target.value; }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">نسبة الخصم (%)</Label>
              <Input 
                id="swal-coupon-discount"
                type="number"
                placeholder="15" 
                className="premium-input h-14 rounded-2xl font-black px-6"
                onChange={(e) => { discountPercentage = e.target.value; }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">تاريخ الانتهاء</Label>
              <Input 
                id="swal-coupon-expiry"
                type="date"
                className="premium-input h-14 rounded-2xl font-bold px-6"
                onChange={(e) => { expiryDate = e.target.value; }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
            <div className="flex items-center gap-3">
              <Switch id="swal-coupon-active" defaultChecked={isActive} onCheckedChange={(val) => { isActive = val; }} />
              <Label htmlFor="swal-coupon-active" className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">تفعيل الكود</Label>
            </div>
            <Ticket className="h-5 w-5 text-primary opacity-20" />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'إصدار الكوبون',
      cancelButtonText: 'إلغاء',
      background: 'var(--card)',
      color: 'var(--text-main)',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.3)]',
        confirmButton: 'bg-primary text-white rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all',
        cancelButton: 'bg-muted text-text-main rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all',
      },
      preConfirm: async () => {
        if (!code.trim() || !discountPercentage.trim()) {
          Swal.showValidationMessage('يرجى ملء كافة الحقول المطلوبة');
          return false;
        }
        try {
          await addDoc(collection(db, 'coupons'), {
            code: code.toUpperCase(),
            title,
            description,
            discountPercentage: Number(discountPercentage),
            expiryDate,
            isActive,
            createdAt: serverTimestamp()
          });
          return true;
        } catch (error) {
          Swal.showValidationMessage('فشل في إصدار الكوبون');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('تم إصدار الكوبون بنجاح');
      }
    });
  };

  const openEditCouponSwal = (coupon: Coupon) => {
    let code = coupon.code;
    let title = coupon.title || '';
    let description = coupon.description || '';
    let discountPercentage = String(coupon.discountPercentage);
    let expiryDate = coupon.expiryDate;
    let isActive = coupon.isActive;

    MySwal.fire({
      title: 'تعديل الكوبون',
      html: (
        <div className="p-4 space-y-6 text-right" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">كود الخصم</Label>
              <Input 
                id="swal-edit-code"
                defaultValue={code}
                className="premium-input h-14 rounded-2xl text-base font-black px-6 uppercase"
                onChange={(e) => { code = e.target.value; }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">عنوان العرض</Label>
              <Input 
                id="swal-edit-title"
                defaultValue={title}
                placeholder="خصم رمضان المبارك" 
                className="premium-input h-14 rounded-2xl font-bold px-6"
                onChange={(e) => { title = e.target.value; }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">وصف العرض (يظهر في الموقع)</Label>
            <Input 
              id="swal-edit-desc"
              defaultValue={description}
              placeholder="استمتع بخصم إضافي عند الحجز في شهر رمضان..." 
              className="premium-input h-14 rounded-2xl font-bold px-6"
              onChange={(e) => { description = e.target.value; }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">نسبة الخصم (%)</Label>
              <Input 
                id="swal-edit-discount"
                type="number"
                defaultValue={discountPercentage}
                className="premium-input h-14 rounded-2xl font-black px-6"
                onChange={(e) => { discountPercentage = e.target.value; }}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">تاريخ الانتهاء</Label>
              <Input 
                id="swal-edit-expiry"
                type="date"
                defaultValue={expiryDate}
                className="premium-input h-14 rounded-2xl font-bold px-6"
                onChange={(e) => { expiryDate = e.target.value; }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
            <div className="flex items-center gap-3">
              <Switch id="swal-edit-active" defaultChecked={isActive} onCheckedChange={(val) => { isActive = val; }} />
              <Label htmlFor="swal-edit-active" className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">حالة الكود</Label>
            </div>
            <Ticket className="h-5 w-5 text-primary opacity-20" />
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
        if (!code.trim() || !discountPercentage.trim()) {
          Swal.showValidationMessage('يرجى ملء كافة الحقول المطلوبة');
          return false;
        }
        try {
          await updateDoc(doc(db, 'coupons', coupon.id), {
            code: code.toUpperCase(),
            title,
            description,
            discountPercentage: Number(discountPercentage),
            expiryDate,
            isActive
          });
          return true;
        } catch (error) {
          Swal.showValidationMessage('فشل في التحديث');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('تم تحديث الكوبون بنجاح');
      }
    });
  };

  const handleDeleteCoupon = async (id: string) => {
    const isConfirmed = await confirm('هل أنت متأكد؟', 'سيتم حذف هذا الكوبون نهائياً!');
    if (!isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('تم حذف الكوبون بنجاح');
    } catch (error) {
      toast.error('فشل في الحذف');
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: !coupon.isActive
      });
    } catch (error) {
      toast.error('فشل في تحديث الحالة');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-text-main tracking-tight gradient-text">إدارة العروض الترويجية</h1>
          <p className="text-sm text-text-muted font-bold">تحكم في أكواد الخصم، العروض، وحملات الولاء.</p>
        </div>
        
        <Button 
          onClick={openAddCouponSwal}
          className="btn-premium h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" />
          <span className="font-black text-xs uppercase tracking-widest">إنشاء كوبون جديد</span>
        </Button>
      </div>

      <div className="premium-card bg-card overflow-hidden border-none shadow-premium">
        <div className="px-10 py-8 border-b border-border/40 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-75">
              <Ticket className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-text-main">سجل العروض النشطة</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>كود الخصم</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الصلاحية</TableHead>
                <TableHead>تحكم الحالة</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="font-black text-primary text-sm tracking-[0.1em] bg-primary/5 px-4 py-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                        {coupon.code}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-success text-lg leading-tight">%{coupon.discountPercentage}</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">OFF TOTAL</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar className="h-3.5 w-3.5 opacity-50" />
                      <span className="text-xs font-black">{coupon.expiryDate || 'صلاحية مفتوحة'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleStatus(coupon)} className="transition-all active:scale-90 flex items-center gap-2">
                      {coupon.isActive ? (
                        <div className="px-4 py-1.5 rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">نشط</span>
                        </div>
                      ) : (
                        <div className="px-4 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">معطل</span>
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditCouponSwal(coupon)}
                        className="h-11 w-11 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="h-11 w-11 rounded-2xl text-text-muted hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
};
