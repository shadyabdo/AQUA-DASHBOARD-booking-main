import React from 'react';
import { Button } from '@/components/ui/button';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { toast, confirm } from '@/src/lib/swal';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FileText, MapPin, Hotel as HotelIcon, DollarSign, CreditCard, Clock, X, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { Booking } from '@/src/types';

interface BookingDetailsProps {
  booking: Booking;
  onClose: () => void;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({ booking, onClose }) => {
  const formatBookingDate = (createdAt: any) => {
    if (!createdAt) return { date: '-', time: '' };
    try {
      const dateObj = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      if (isNaN(dateObj.getTime())) return { date: '-', time: '' };
      return {
        date: dateObj.toLocaleDateString('ar-EG', { dateStyle: 'long' }),
        time: dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: '-', time: '' };
    }
  };

  const bookingDate = formatBookingDate(booking.createdAt);
  const displayName = booking.guestName || booking.userName || 'مستخدم مجهول';
  const displayEmail = booking.guestEmail || booking.userEmail || '-';
  const displayPrice = booking.price || booking.roomPrice || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': 
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10 flex items-center gap-1 px-3 py-1 text-[10px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            مؤكد
          </Badge>
        );
      case 'cancelled': 
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10 flex items-center gap-1 px-3 py-1 text-[10px] font-bold">
            <XCircle className="h-3 w-3" />
            ملغي
          </Badge>
        );
      default: 
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/10 flex items-center gap-1 px-3 py-1 text-[10px] font-bold">
            <Clock className="h-3 w-3" />
            قيد الانتظار
          </Badge>
        );
    }
  };

  return (
    <div className="text-right p-4 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-[2rem] border border-border/40 flex-row-reverse">
        <div className="w-20 h-20 rounded-2xl bg-muted border-4 border-card shadow-xl overflow-hidden ring-4 ring-primary/5">
          <img 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} 
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-1.5 flex-1">
          <h3 className="text-2xl font-black text-text-main tracking-tight">{displayName}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-primary select-all">{displayEmail}</span>
            <div className="flex items-center gap-3 justify-end">
              <span className="text-[10px] text-text-muted font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3" /> سجل دخول المستخدم
              </span>
              <Badge variant="outline" className="text-[9px] font-black bg-primary/5 text-primary border-primary/20 px-3 py-0.5 rounded-md uppercase">ID: {booking.id?.substring(0, 12)}...</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mr-2">تفاصيل المنشأة والوحدة</Label>
            <div className="p-6 bg-card border border-border/40 rounded-[2rem] space-y-4 shadow-sm group hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3 flex-row-reverse">
                <HotelIcon className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                <div className="text-right">
                  <p className="font-black text-sm text-text-main group-hover:text-primary transition-colors">{booking.hotelName || booking.hotelId}</p>
                  <p className="text-[11px] text-text-muted font-bold mt-0.5">{booking.roomTitle || booking.roomId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mr-2">القيمة التقديرية</Label>
            <div className="p-8 bg-success/5 border-2 border-success/10 rounded-[2rem] flex items-center justify-between group overflow-hidden relative flex-row-reverse">
              <DollarSign className="absolute -left-4 -bottom-4 h-24 w-24 text-success/5 transform rotate-12 group-hover:scale-110 transition-transform" />
              <div className="relative z-10 text-right">
                <p className="text-[10px] font-bold text-success/60 uppercase tracking-widest mb-1">صافي المبلغ</p>
                <p className="text-3xl font-black text-success tracking-tighter">${displayPrice}</p>
              </div>
              <CreditCard className="h-10 w-10 text-success/20 group-hover:text-success transition-colors" />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mr-2">الأختام الزمنية</Label>
            <div className="p-6 bg-muted/20 border border-border/40 rounded-[2rem] space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-xs group flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <Clock className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary" />
                  <span className="text-text-muted font-bold uppercase tracking-widest text-[10px]">تاريخ التسجيل:</span>
                </div>
                <span className="font-black text-text-main text-sm">
                  {bookingDate.date}
                  <span className="mx-2 text-text-muted/30">|</span>
                  {bookingDate.time}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mr-2">الحالة والخيارات</Label>
            <div className="flex flex-col gap-4">
              <div className="scale-110 origin-left transition-transform hover:scale-[1.12] flex justify-end">
                {getStatusBadge(booking.status)}
              </div>
              <Button variant="outline" className="w-full h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all gap-3 shadow-lg shadow-black/5" onClick={() => window.print()}>
                <FileText className="h-4 w-4" />
                تصدير الفاتورة الرقمية (PDF)
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-10 border-t border-border/40 flex-row-reverse">
        <Button onClick={onClose} className="btn-premium h-14 px-12 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20">
          إغلاق المستند
        </Button>
        <Button 
          variant="ghost" 
          onClick={async () => {
            const isConfirmed = await confirm('حذف الحجز', 'هل أنت متأكد من حذف هذا الحجز نهائياً من النظام؟');
            if (isConfirmed) {
              try {
                await deleteDoc(doc(db, 'bookings', booking.id));
                toast.success('تم حذف الحجز بنجاح');
                onClose();
                // Simple refresh logic
                setTimeout(() => window.location.reload(), 500);
              } catch (e) {
                toast.error('فشل في حذف الحجز');
              }
            }
          }}
          className="h-14 px-8 font-black text-xs uppercase tracking-widest rounded-2xl text-destructive hover:bg-destructive/5 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          حذف السجل
        </Button>
      </div>
    </div>
  );
};
