import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, updateDoc, doc, deleteDoc, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { handleFirestoreError, OperationType } from '@/src/lib/firestoreErrorHandler';
import { Booking } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, User, Hotel as HotelIcon, CheckCircle2, XCircle, Clock, MapPin, CreditCard, Info, DollarSign, Shield, FileText, ChevronRight, X, Trash2 } from 'lucide-react';
import MySwal, { toast, confirm } from '@/src/lib/swal';
import { BookingDetails } from './forms/BookingDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BookingManagerProps {
  isDashboard?: boolean;
}

export const BookingManager: React.FC<BookingManagerProps> = ({ isDashboard }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const snapshot = await firestoreGetDocs(q);
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
      } catch (error) {
        console.error("Bookings fetch failed:", error);
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    };
    fetchBookings();
  }, []);

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      toast.success(`Booking ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const handleDelete = async (bookingId: string) => {
    const isConfirmed = await confirm('حذف الحجز', 'هل أنت متأكد من حذف هذا الحجز نهائياً من النظام؟');
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success('تم حذف الحجز بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('فشل في حذف الحجز');
    }
  };

  const openBookingDetailsSwal = (booking: Booking) => {
    MySwal.fire({
      html: (
        <div className="p-8">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-90">
              <Info className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black tracking-tight text-text-main">تفاصيل وثيقة الحجز</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">مراجعة البيانات المالية واللوجستية</p>
            </div>
          </div>
          <BookingDetails 
            booking={booking}
            onClose={() => MySwal.close()} 
          />
        </div>
      ),
      showConfirmButton: false,
      width: '70vw',
      background: 'var(--card)',
      padding: 0,
      customClass: {
        popup: 'rounded-[2.5rem] bg-card/95 backdrop-blur-2xl border-none shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden',
      }
    });
  };

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

  const formatBookingDate = (createdAt: any) => {
    if (!createdAt) return { date: '-', time: '' };
    try {
      const dateObj = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      if (isNaN(dateObj.getTime())) return { date: '-', time: '' };
      return {
        date: dateObj.toLocaleDateString('ar-EG'),
        time: dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: '-', time: '' };
    }
  };

  return (
    <div className={cn(
      "w-full",
      !isDashboard && "premium-card overflow-hidden"
    )}>
      {!isDashboard && (
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-text-main">إدارة الحجوزات</h2>
              <p className="text-xs text-text-muted font-medium">متابعة وتحديث حالات حجوزات العملاء.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table className="table-premium">
          <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الفندق والغرفة</TableHead>
              <TableHead>القيمة</TableHead>
              <TableHead>التاريخ والوقت</TableHead>
              <TableHead>الحالة</TableHead>
              {!isDashboard && <TableHead className="text-right">الإجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const bookingDate = formatBookingDate(booking.createdAt);
              const displayName = booking.guestName || booking.userName || 'ضيف';
              const displayEmail = booking.guestEmail || booking.userEmail || '-';
              const displayPrice = booking.price || booking.roomPrice || 0;

              return (
                <TableRow 
                  key={booking.id}
                  className="group cursor-pointer"
                  onClick={() => openBookingDetailsSwal(booking)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden">
                        <img 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} 
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main text-sm">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-text-muted font-medium">#{booking.id?.substring(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-text-muted select-all">
                      {displayEmail}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-text-main text-xs">{booking.hotelName || booking.hotelId}</span>
                      <span className="text-[10px] text-text-muted font-medium">{booking.roomTitle || booking.roomId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-success text-sm">${displayPrice}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-text-main">
                        {bookingDate.date}
                      </span>
                      <span className="text-[9px] text-text-muted font-medium">
                        {bookingDate.time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  {!isDashboard && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-start gap-2">
                        <Select 
                          onValueChange={(v) => updateStatus(booking.id, v)} 
                          defaultValue={booking.status}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-[10px] font-bold rounded-lg bg-card">
                            <SelectValue placeholder="الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending" className="text-xs">قيد الانتظار</SelectItem>
                            <SelectItem value="confirmed" className="text-xs">تأكيد</SelectItem>
                            <SelectItem value="cancelled" className="text-xs text-destructive">إلغاء</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(booking.id)}
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
