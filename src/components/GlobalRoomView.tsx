import React, { useState, useEffect } from 'react';
import { collectionGroup, query, orderBy, deleteDoc, doc, collection, getDocs as firestoreGetDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/src/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from '@/src/lib/firestoreErrorHandler';
import { Room, Hotel, City } from '@/src/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bed, Trash2, Search, Building2, MapPin, DollarSign, Image as ImageIcon, Plus, X, Sparkles, Shield, Trash, ChevronLeft, ChevronRight, Minus, Cigarette, Maximize2, Edit2, Star } from 'lucide-react';
import MySwal, { toast, confirm } from '@/src/lib/swal';
// RTL helper for SweetAlert2 popups
const applyRTL = (popup: HTMLElement) => {
  popup.style.direction = 'rtl';
  const els = popup.querySelectorAll<HTMLElement>('.swal2-title, .swal2-html-container, .swal2-content');
  els.forEach(el => { el.style.textAlign = 'center'; el.style.direction = 'rtl'; });
};
import { RoomForm } from './forms/RoomForm';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalRoomView: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data for adding new room
  const [cities, setCities] = useState<City[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);

  // Lightbox Viewer State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerZoom, setViewerZoom] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const citiesSnap = await firestoreGetDocs(collection(db, 'cities'));
        const cityList = citiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as City));
        setCities(cityList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      } catch (error) {
        console.warn('GlobalRoom: cities fetch error', error);
      }

      // 2. Fetch Rooms & Hotels (One-time fetch to avoid SDK assertion bugs)
      try {
        const [roomsSnap, hotelsSnap] = await Promise.all([
          firestoreGetDocs(query(collectionGroup(db, 'rooms'))),
          firestoreGetDocs(query(collectionGroup(db, 'hotels')))
        ]);

        const roomList = roomsSnap.docs.map(doc => {
          const parts = doc.ref.path.split('/');
          return { id: doc.id, cityId: parts[1], hotelId: parts[3], ...doc.data() } as Room;
        });
        setRooms(roomList);

        const hotelList = hotelsSnap.docs.map(doc => {
          const parts = doc.ref.path.split('/');
          return { id: doc.id, cityId: parts[1], ...doc.data() } as Hotel;
        });
        setHotels(hotelList.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      } catch (error: any) {
        console.warn('GlobalRoom: One-time fetch failed, trying manual crawl...', error);
        // Manual crawl fallback
        try {
          const citiesSnap = await firestoreGetDocs(collection(db, 'cities'));
          const allRooms: Room[] = [];
          const allHotels: Hotel[] = [];
          
          for (const cityDoc of citiesSnap.docs) {
            const hSnap = await firestoreGetDocs(collection(db, 'cities', cityDoc.id, 'hotels'));
            for (const hDoc of hSnap.docs) {
              allHotels.push({ id: hDoc.id, cityId: cityDoc.id, ...hDoc.data() } as Hotel);
              const rSnap = await firestoreGetDocs(collection(db, 'cities', cityDoc.id, 'hotels', hDoc.id, 'rooms'));
              rSnap.docs.forEach(rDoc => {
                allRooms.push({ id: rDoc.id, cityId: cityDoc.id, hotelId: hDoc.id, ...rDoc.data() } as Room);
              });
            }
          }
          setRooms(allRooms);
          setHotels(allHotels.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        } catch (crawlErr) {
          console.error('GlobalRoom: Manual crawl failed', crawlErr);
          toast.error('فشل في تحميل البيانات. يرجى التأكد من صلاحيات المسؤول.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const citiesSnap = await firestoreGetDocs(collection(db, 'cities'));
      const allRooms: Room[] = [];
      const allHotels: Hotel[] = [];
      
      for (const cityDoc of citiesSnap.docs) {
        const hSnap = await firestoreGetDocs(collection(db, 'cities', cityDoc.id, 'hotels'));
        for (const hDoc of hSnap.docs) {
          allHotels.push({ id: hDoc.id, cityId: cityDoc.id, ...hDoc.data() } as Hotel);
          const rSnap = await firestoreGetDocs(collection(db, 'cities', cityDoc.id, 'hotels', hDoc.id, 'rooms'));
          rSnap.docs.forEach(rDoc => {
            allRooms.push({ id: rDoc.id, cityId: cityDoc.id, hotelId: hDoc.id, ...rDoc.data() } as Room);
          });
        }
      }
      setRooms(allRooms);
      setHotels(allHotels.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      toast.success('تم تحديث البيانات بنجاح');
    } catch (error) {
      console.error('Refresh failed', error);
      toast.error('فشل تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };
  const openAddRoomSwal = () => {
    MySwal.fire({
      html: (
        <div className="p-8">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-90">
              <Bed className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black tracking-tight text-text-main">إضافة غرفة جديدة</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">نظام إدارة الأصول الموحد</p>
            </div>
          </div>
          <RoomForm 
            cities={cities} 
            hotels={hotels} 
            onSubmit={async (data) => {
              if (!data.cityId || !data.hotelId) {
                toast.error('يرجى اختيار المدينة والفندق أولاً');
                return;
              }
              if (!data.Room_name?.trim()) {
                toast.error('يرجى كتابة اسم الغرفة');
                return;
              }
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
                refreshData();
              } catch (error) {
                console.error(error);
                toast.error('فشل في إضافة الغرفة');
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">تحديث معلومات الغرفة أو الجناح</p>
            </div>
          </div>
          <RoomForm 
            cities={cities} 
            hotels={hotels} 
            initialData={room}
            isEdit={true}
            onSubmit={async (data) => {
              try {
                const { cityId, hotelId, imageUrls, id, ...roomData } = data;
                // Since RoomForm handles the data mapping, we just need to update the doc
                // If city/hotel changed, it's more complex, but RoomForm usually keeps them for simplicity in edit
                await updateDoc(doc(db, 'cities', data.cityId, 'hotels', data.hotelId, 'rooms', room.id), {
                  ...roomData,
                  updatedAt: serverTimestamp()
                });
                toast.success('تم تحديث البيانات بنجاح ✓');
                MySwal.close();
                refreshData();
              } catch (error) {
                console.error(error);
                toast.error('فشل في تحديث البيانات');
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


  const openViewer = (images: string[], index: number = 0) => {
    if (!images || images.length === 0) return;
    setViewerImages(images);
    setViewerIndex(index);
    setViewerZoom(1);
    setIsViewerOpen(true);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setViewerZoom(prev => Math.min(4, prev + 0.1));
    } else {
      setViewerZoom(prev => Math.max(1, prev - 0.1));
    }
  };

  const nextImage = () => {
    setViewerIndex((prev) => (prev + 1) % viewerImages.length);
    setViewerZoom(1);
  };

  const prevImage = () => {
    setViewerIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length);
    setViewerZoom(1);
  };

  const handleDeleteRoom = async (room: Room) => {
    const isConfirmed = await confirm('هل أنت متأكد؟', 'سيتم حذف هذه الغرفة نهائياً!');
    if (!isConfirmed) return;
    try {
      if (room.cityId && room.hotelId) {
        await deleteDoc(doc(db, 'cities', room.cityId, 'hotels', room.hotelId, 'rooms', room.id));
        toast.success('تم حذف الغرفة بنجاح');
      }
    } catch (error) {
      console.error(error);
      toast.error('فشل في حذف الغرفة');
    }
  };

  const filteredRooms = rooms.filter(room => 
    (room.Room_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-text-main tracking-tight flex items-center gap-4 gradient-text">
            مدير الغرف الشامل
          </h1>
          <p className="text-sm text-text-muted font-bold">مركز تحكم موحد لجميع الغرف والأجنحة عبر محفظة الفنادق والمدن.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <Button 
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="h-14 px-6 rounded-2xl border-border/40 font-black text-xs gap-2"
          >
            <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
            تحديث
          </Button>
          <Button 
            onClick={openAddRoomSwal}
            className="btn-premium h-14 px-8 rounded-2xl w-full sm:w-auto shadow-lg shadow-primary/20 gap-3"
          >
            <Plus className="h-5 w-5" />
            <span className="font-black italic">إضافة غرفة جديدة</span>
          </Button>

          <div className="relative w-full xl:w-[400px] group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <Input
              placeholder="البحث عن اسم غرفة أو جناح..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pr-12 text-sm font-black rounded-2xl bg-card/50 backdrop-blur-xl border-border/40 focus:ring-primary/10 transition-all shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="premium-card bg-card overflow-hidden">
        <div className="px-10 py-8 border-b border-border/40 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-75">
              <Bed className="h-7 w-7" />
            </div>
            <div className="text-lg font-black tracking-tight text-text-main">
              نتائج البحث <span className="text-primary mx-1">({filteredRooms.length})</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="hover:bg-transparent transition-none">
                <TableHead className="w-[300px]">اسم الغرفة والبيانات</TableHead>
                <TableHead className="w-[180px]">السعر الليلي</TableHead>
                <TableHead className="w-[200px]">وجهة النظر</TableHead>
                <TableHead className="w-[220px]">مواصفات الوحدة</TableHead>
                <TableHead className="w-[200px]">الوسائط المرئية</TableHead>
                <TableHead className="w-[150px]">التقييم</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredRooms.map((room, idx) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    key={room.id}
                    className="group hover:bg-muted/50 transition-all duration-300"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="font-black text-text-main text-lg tracking-tight group-hover:text-primary transition-colors">{room.Room_name}</div>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-primary/10">
                            الفندق: {hotels.find(h => h.id === room.hotelId)?.name || room.hotelId?.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="stat-icon-glow bg-success/5 text-success mb-0 scale-[0.6] ring-0">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <span className="font-black text-success text-xl tracking-tighter">{room.السعر}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl w-fit border border-border/40">
                        <ImageIcon className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-xs font-bold text-text-main italic">{room.الإطلالة || 'إطلالة بانورامية'}</span>
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
                    <TableCell>
                      <div className="flex -space-x-3 rtl:space-x-reverse items-center cursor-pointer" onClick={() => openViewer(room.Room_img || [])}>
                        {Array.isArray(room.Room_img) && room.Room_img.slice(0, 4).map((img, i) => (
                          <div key={i} className="relative group/img" onClick={(e) => { e.stopPropagation(); openViewer(room.Room_img || [], i); }}>
                            <img 
                              src={img} 
                              className="w-10 h-10 rounded-2xl border-4 border-card shadow-lg object-cover transition-transform group-hover/img:scale-125 group-hover/img:z-10 group-hover/img:rotate-3" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                        {Array.isArray(room.Room_img) && room.Room_img.length > 4 && (
                          <div className="w-10 h-10 rounded-2xl border-4 border-card bg-muted flex items-center justify-center text-[10px] font-black shadow-lg">
                            +{room.Room_img.length - 4}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-0.5">
                          {room.rating && room.rating > 0 ? (
                            Array.from({ length: 5 }).map((_, i) => {
                              const starValue = i + 1;
                              const isFull = starValue <= room.rating!;
                              const isHalf = !isFull && (starValue - 0.5) <= room.rating!;
                              
                              return (
                                <div key={i} className="relative">
                                  <Star
                                    className={`h-3 w-3 ${
                                      isFull || isHalf
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-border fill-transparent'
                                    }`}
                                    style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                                  />
                                  {isHalf && (
                                    <Star
                                      className="h-3 w-3 text-border fill-transparent absolute inset-0"
                                    />
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-text-muted font-bold">—</span>
                          )}
                        </div>
                        {room.reviewsCount !== undefined && (
                          <span className="text-[9px] font-black text-text-muted mr-0.5">
                            ({room.reviewsCount} تقييم)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditRoomSwal(room)}
                          className="h-12 w-12 rounded-2xl text-text-muted hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all duration-300"
                        >
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRoom(room)}
                          className="h-12 w-12 rounded-2xl text-text-muted hover:bg-destructive/10 hover:text-destructive hover:scale-110 transition-all duration-300"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && filteredRooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-8"
                    >
                      <div className="w-32 h-32 rounded-[2.5rem] bg-muted/50 flex items-center justify-center border-2 border-dashed border-border/50">
                        <Bed className="h-12 w-12 text-text-muted/20" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-text-main tracking-tight">لا توجد نتائج بحث</p>
                        <p className="text-sm text-text-muted font-bold">حاول استخدام كلمات مفتاحية مختلفة للعثور على الغرفة المطلوبة.</p>
                      </div>
                    </motion.div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent showCloseButton={false} className="w-[500px] max-w-[500px] h-[85vh] p-0 border-none bg-black/95 backdrop-blur-2xl rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">معاينة صور الغرفة</span>
                <span className="text-sm font-black text-white">{viewerIndex + 1} / {viewerImages.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewerZoom(prev => Math.min(prev + 0.5, 4))}
                className="text-white hover:bg-white/10 rounded-full h-12 w-12"
              >
                <Plus className="h-6 w-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewerZoom(prev => Math.max(prev - 0.5, 1))}
                className="text-white hover:bg-white/10 rounded-full h-12 w-12"
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="w-[1px] h-8 bg-white/10 mx-2" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsViewerOpen(false)}
                className="text-white hover:bg-white/10 rounded-full h-12 w-12"
              >
                <X className="h-7 w-7" />
              </Button>
            </div>
          </div>
          
          <div className="relative w-full h-full flex items-center justify-center p-12 overflow-hidden" onWheel={handleWheel}>
            <AnimatePresence mode="wait">
              <motion.div
                key={viewerIndex}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: viewerZoom, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-h-[60vh] flex items-center justify-center"
              >
                <img
                  src={viewerImages[viewerIndex]}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </AnimatePresence>

            {viewerImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 group"
                >
                  <ChevronLeft className="h-10 w-10 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 group"
                >
                  <ChevronRight className="h-10 w-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 pt-10 bg-gradient-to-t from-black/80 to-transparent z-50">
            <div className="flex items-center justify-center gap-2 max-w-full mx-auto overflow-x-auto pb-2 custom-scrollbar">
              {viewerImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setViewerIndex(i); setViewerZoom(1); }}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-500 ${
                    i === viewerIndex 
                      ? 'border-primary scale-110 shadow-lg shadow-primary/20 z-10' 
                      : 'border-white/5 opacity-40 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {i === viewerIndex && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
