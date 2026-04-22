import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, orderBy, collectionGroup, updateDoc, serverTimestamp, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/src/lib/firestoreErrorHandler';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/lib/firebase';
import { Hotel, Room, City } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Bed, DollarSign, Sparkles, Hotel as HotelIcon, Image as ImageIcon, Edit2, X, Search, MapPin, Zap, Info, ChevronRight, Cigarette, Maximize2 } from 'lucide-react';
import MySwal, { toast, confirm } from '@/src/lib/swal';
// RTL helper for SweetAlert2 popups
const applyRTL = (popup: HTMLElement) => {
  popup.style.direction = 'rtl';
  const els = popup.querySelectorAll<HTMLElement>('.swal2-title, .swal2-html-container, .swal2-content');
  els.forEach(el => { el.style.textAlign = 'center'; el.style.direction = 'rtl'; });
};
import { RoomForm } from './forms/RoomForm';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RoomManagerProps {
  overrideCityId?: string;
  overrideHotelId?: string;
}

export const RoomManager: React.FC<RoomManagerProps> = ({ overrideCityId, overrideHotelId }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedHotelId, setSelectedHotelId] = useState<string>(overrideHotelId || '');
  const [selectedHotelCityId, setSelectedHotelCityId] = useState<string>(overrideCityId || '');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const citiesSnap = await firestoreGetDocs(collection(db, 'cities'));
        const cityList = citiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
        setCities(cityList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      } catch (err) {
        console.error('Cities fetch error:', err);
      }

      // 2. Fetch hotels (One-time to avoid SDK crash)
      try {
        if (overrideCityId) {
          const hSnap = await firestoreGetDocs(collection(db, 'cities', overrideCityId, 'hotels'));
          const list = hSnap.docs.map(doc => ({ id: doc.id, cityId: overrideCityId, ...doc.data() } as Hotel));
          setHotels(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        } else {
          try {
            const cgSnap = await firestoreGetDocs(query(collectionGroup(db, 'hotels')));
            const list = cgSnap.docs.map(doc => {
              const data = doc.data();
              const parts = doc.ref.path.split('/');
              const cityId = parts.length >= 4 ? parts[parts.length - 3] : (data.cityId || '');
              return { id: doc.id, cityId, ...data } as Hotel;
            });
            setHotels(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
          } catch (cgErr) {
             console.warn('RoomManager: hotels collectionGroup failed, using fallback');
             const citiesSnap = await firestoreGetDocs(collection(db, 'cities'));
             const allHotels: Hotel[] = [];
             for (const cityDoc of citiesSnap.docs) {
               const hSnap = await firestoreGetDocs(collection(db, 'cities', cityDoc.id, 'hotels'));
               hSnap.docs.forEach(hDoc => {
                 allHotels.push({ id: hDoc.id, cityId: cityDoc.id, ...hDoc.data() } as Hotel);
               });
             }
             setHotels(allHotels.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
          }
        }
      } catch (err) {
        console.error('RoomManager: Load hotels failed', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [overrideCityId]);
  
  useEffect(() => {
    if (!selectedHotelId || !selectedHotelCityId) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      try {
        const snapshot = await firestoreGetDocs(collection(db, 'cities', selectedHotelCityId, 'hotels', selectedHotelId, 'rooms'));
        setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn('Rooms: permission-denied fetching rooms');
        } else {
          console.error('Rooms: rooms fetch error', error);
        }
      }
    };
    fetchRooms();
  }, [selectedHotelId, selectedHotelCityId]);

  const filteredRooms = rooms.filter(room => 
    (room.Room_name || '').toLowerCase().includes(roomSearchQuery.toLowerCase())
  );

  const openAddRoomSwal = () => {
    MySwal.fire({
      html: (
        <div className="p-8">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-90">
              <Bed className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black tracking-tight text-text-main">تسجيل وحدة سكنية</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">نظام إدارة المحتوى الفندقي</p>
            </div>
          </div>
          <RoomForm 
            cities={cities} 
            hotels={hotels} 
            initialData={{ cityId: overrideCityId, hotelId: overrideHotelId }}
            onSubmit={async (data) => {
              if (!data.cityId || !data.hotelId) {
                toast.error('يرجى اختيار المدينة والفندق أولاً');
                return;
              }
              if (!data.Room_name?.trim()) {
                toast.error('يرجى كتابة اسم الغرفة');
                return;
              }
              setLoading(true);
              try {
                const { cityId, hotelId, imageUrls, ...roomData } = data;
                await addDoc(collection(db, 'cities', cityId, 'hotels', hotelId, 'rooms'), {
                  ...roomData,
                  cityId,
                  hotelId,
                  createdAt: serverTimestamp()
                });
                toast.success('تمت إضافة الغرفة بنجاح ✓');
                MySwal.close();
                // Refresh rooms list
                const rSnap = await firestoreGetDocs(collection(db, 'cities', cityId, 'hotels', hotelId, 'rooms'));
                setRooms(prev => {
                  const filtered = prev.filter(r => !(r.cityId === cityId && r.hotelId === hotelId));
                  const newRooms = rSnap.docs.map(d => ({ id: d.id, cityId, hotelId, ...d.data() } as Room));
                  return [...filtered, ...newRooms];
                });
              } catch (error) {
                console.error(error);
                toast.error('فشل في إضافة الغرفة');
              } finally {
                setLoading(false);
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

  const handleDeleteRoom = async (room: Room) => {
    const isConfirmed = await confirm('هل أنت متأكد؟', 'سيتم حذف هذه الغرفة نهائياً!');
    if (!isConfirmed) return;
    try {
      if (room.cityId && room.hotelId) {
        await deleteDoc(doc(db, 'cities', room.cityId, 'hotels', room.hotelId, 'rooms', room.id));
      } else {
        // Fallback or error
        toast.error('Data error: missing city or hotel ID');
        return;
      }
      toast.success('Room deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `rooms/${room.id}`);
    }
  };

  const handleHotelSelect = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    setSelectedHotelId(hotelId);
    setSelectedHotelCityId(hotel?.cityId || '');
  };

  const openEditRoomSwal = (room: Room) => {
    MySwal.fire({
      html: (
        <div className="p-8">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-90">
              <Edit2 className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black tracking-tight text-text-main">تعديل بيانات الوحدة</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">مزامنة التغييرات للنظام السحابي</p>
            </div>
          </div>
          <RoomForm 
            cities={cities} 
            hotels={hotels} 
            initialData={room}
            isEdit={true}
            onSubmit={async (data) => {
              setLoading(true);
              try {
                const cityId = room.cityId || data.cityId || selectedHotelCityId;
                const hotelId = room.hotelId || data.hotelId || selectedHotelId;
                if (!cityId || !hotelId) {
                  toast.error('بيانات غير مكتملة');
                  return;
                }
                const { cityId: _c, hotelId: _h, imageUrls, ...roomData } = data;
                await updateDoc(doc(db, 'cities', cityId, 'hotels', hotelId, 'rooms', room.id), {
                  ...roomData,
                  cityId,
                  hotelId
                });
                toast.success('تم تحديث الغرفة بنجاح ✓');
                MySwal.close();
                setRooms(prev => prev.map(r => r.id === room.id ? { ...r, ...roomData, cityId, hotelId } : r));
              } catch (error) {
                console.error(error);
                toast.error('فشل في تحديث الغرفة');
              } finally {
                setLoading(false);
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

  return (
    <div className="space-y-10 focus-visible:outline-none">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-text-main tracking-tight gradient-text">إدارة الوحدات السكنية</h1>
          <p className="text-sm text-text-muted font-bold">تخصيص الخيارات السكنية وتحديد مصفوفة الأسعار والخدمات لكل فئة.</p>
        </div>

          <Button onClick={openAddRoomSwal} className="btn-premium h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20">
            <Plus className="h-5 w-5" />
            <span className="font-black text-xs uppercase tracking-widest">إضافة غرفة جديدة</span>
          </Button>
      </div>

      <div className="premium-card bg-card overflow-hidden">
        <div className="px-10 py-8 border-b border-border/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-75">
              <Bed className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-text-main">مستودع الوحدات المتاحة</h2>
          </div>
          {/* List filters... */}
          {!overrideHotelId && (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-fit">
              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="البحث في الغرف..." 
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  className="pl-14 h-14 text-sm font-black rounded-2xl bg-card border-border/40 focus:ring-primary/10 transition-all shadow-inner"
                />
              </div>
              <div className="w-full sm:w-64">
                <Select onValueChange={handleHotelSelect} value={selectedHotelId}>
                  <SelectTrigger className="h-14 text-sm font-black uppercase tracking-wider rounded-2xl bg-card border-border/40 focus:ring-primary/10 transition-all shadow-inner">
                    <SelectValue placeholder="تصفية الوصلات" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-premium p-1 backdrop-blur-3xl bg-card/80">
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id} className="text-sm font-bold rounded-xl focus:bg-primary focus:text-white py-3 my-1">
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {overrideHotelId && (
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="البحث العميق في سجلات الغرف..." 
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                className="pl-14 h-14 text-sm font-black rounded-2xl bg-card border-border/40 focus:ring-primary/10 transition-all shadow-inner"
              />
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%]">اسم الفئة</TableHead>
                <TableHead>الاستحقاق الليلة</TableHead>
                <TableHead>الألبوم البصري</TableHead>
                <TableHead>مواصفات الوحدة</TableHead>
                <TableHead className="text-left">التحكم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow 
                  key={room.id}
                  className="group hover:bg-muted/30 transition-all duration-300"
                >
                  <TableCell>
                    <div className="flex items-center gap-5">
                      <div className="bg-primary/10 p-3 rounded-2xl text-primary transform group-hover:rotate-12 transition-transform">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-text-main text-lg tracking-tight group-hover:text-primary transition-colors">{room.Room_name}</span>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                           <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">Verified Category</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                       <span className="font-black text-success text-2xl tracking-tighter">${room.السعر}</span>
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest self-end pb-1 opacity-50">/ Night</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-4 rtl:space-x-reverse items-center cursor-pointer">
                      {room.Room_img?.slice(0, 4).map((img, i) => (
                        <div key={i} className="relative group/mini-img">
                          <img 
                            src={img} 
                            className="w-11 h-11 rounded-2xl border-4 border-card object-cover shadow-lg transition-all group-hover/mini-img:scale-125 group-hover/mini-img:z-10 group-hover/mini-img:-rotate-3" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      ))}
                      {(room.Room_img?.length || 0) > 4 && (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-[10px] font-black border-4 border-card text-text-muted shadow-lg group-hover:bg-primary group-hover:text-white transition-colors">
                          +{(room.Room_img?.length || 0) - 4}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-primary/5 text-primary px-2.5 py-1 rounded-lg border border-primary/10 flex items-center gap-1">
                          <Maximize2 className="h-3 w-3" /> {room.size || '0'} م²
                        </span>
                        <span className="text-[10px] font-black uppercase bg-primary/5 text-primary px-2.5 py-1 rounded-lg border border-primary/10 flex items-center gap-1">
                          <Bed className="h-3 w-3" /> {room.bed || '0'}
                        </span>
                      </div>
                      <div className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border w-fit flex items-center gap-1 ${
                        room.isSmokingAllowed 
                          ? 'bg-success/5 text-success border-success/10' 
                          : 'bg-destructive/5 text-destructive border-destructive/10'
                      }`}>
                        {room.isSmokingAllowed ? <Cigarette className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {room.isSmokingAllowed ? 'مسموح بالتدخين' : 'ممنوع التدخين'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-3 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditRoomSwal(room)} 
                        className="h-11 w-11 rounded-2xl hover:bg-primary/10 hover:text-primary hover:scale-110 transition-transform"
                      >
                        <Edit2 className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteRoom(room)} 
                        className="h-11 w-11 rounded-2xl hover:bg-destructive/10 hover:text-destructive hover:scale-110 transition-transform"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!selectedHotelId && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40">
                    <div className="flex flex-col items-center gap-8">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-muted/50 flex items-center justify-center border-2 border-dashed border-border/50 animate-pulse">
                        <Bed className="h-12 w-12 text-text-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-text-main">انتظار التصفية الجغرافية</p>
                        <p className="text-sm text-text-muted font-bold">يرجى اختيار فندق من القائمة العلوية لعرض وتعديل الغرف.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {selectedHotelId && rooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40">
                    <div className="flex flex-col items-center gap-8">
                       <div className="w-32 h-32 rounded-[2.5rem] bg-muted/50 flex items-center justify-center border-2 border-dashed border-border/50">
                        <Plus className="h-12 w-12 text-text-muted/20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-text-main">لا توجد غرف متاحة</p>
                        <p className="text-sm text-text-muted font-bold">هذا الفندق لا يحتوي على أي فئات سكنية حالياً.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
