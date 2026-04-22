import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { handleFirestoreError, OperationType } from '@/src/lib/firestoreErrorHandler';
import { City } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, MapPin, Star, Image as ImageIcon, Building2, Bed, ChevronRight, X, Search, Edit2, Compass, MapPin as MapPinIcon } from 'lucide-react';
import { toast, confirm, default as MySwal } from '@/src/lib/swal';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { HotelManager } from './HotelManager';
import { RoomManager } from './RoomManager';
import { cn } from '@/lib/utils';

export const CityManager: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const q = query(collection(db, 'cities'), orderBy('name'));
        const snapshot = await firestoreGetDocs(q);
        setCities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as City)));
      } catch (error) {
        console.error("Cities fetch failed:", error);
      }
    };
    fetchCities();
  }, []);

  const openAddCitySwal = () => {
    let name = '';
    let img = '';
    let featured = true;

    MySwal.fire({
      title: 'تنشيط وجهة جديدة',
      html: (
        <div className="p-4 space-y-6 text-right" dir="rtl">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">اسم الوجهة الجغرافية</Label>
            <Input 
              id="swal-city-name"
              placeholder="مثل: القاهرة، جزر المالديف..." 
              className="premium-input h-14 rounded-2xl text-base font-black px-6"
              onChange={(e) => { name = e.target.value; }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">رابط الصورة السينمائية</Label>
            <div className="relative group">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input 
                id="swal-city-img"
                placeholder="https://images.unsplash.com/city-view.jpg" 
                className="premium-input h-14 pl-12 rounded-2xl font-bold"
                onChange={(e) => { img = e.target.value; }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
            <div className="flex items-center gap-3">
              <Switch id="swal-city-featured" defaultChecked={true} onCheckedChange={(val) => { featured = val; }} />
              <Label htmlFor="swal-city-featured" className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">تمييز الوجهة</Label>
            </div>
            <Star className="h-5 w-5 text-warning/40" />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'تنشيط الوجهة',
      cancelButtonText: 'إلغاء الأمر',
      background: 'var(--card)',
      color: 'var(--text-main)',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.3)]',
        confirmButton: 'bg-primary text-white rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all',
        cancelButton: 'bg-muted text-text-main rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all',
      },
      preConfirm: async () => {
        if (!name.trim()) {
          Swal.showValidationMessage('يرجى إدخال اسم الوجهة');
          return false;
        }
        try {
          await addDoc(collection(db, 'cities'), {
            name,
            city_img: img,
            isFeatured: featured
          });
          return true;
        } catch (error) {
          Swal.showValidationMessage('فشل في إضافة الوجهة');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('تمت إضافة الوجهة بنجاح');
      }
    });
  };

  const openEditCitySwal = (city: City) => {
    let name = city.name;
    let img = city.city_img;
    let featured = city.isFeatured;

    MySwal.fire({
      title: 'تعديل الوجهة',
      html: (
        <div className="p-4 space-y-6 text-right" dir="rtl">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">اسم الوجهة</Label>
            <Input 
              id="swal-edit-name"
              defaultValue={name}
              className="premium-input h-14 rounded-2xl text-base font-black px-6"
              onChange={(e) => { name = e.target.value; }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">رابط الصورة</Label>
            <div className="relative group">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input 
                id="swal-edit-img"
                defaultValue={img}
                className="premium-input h-14 pl-12 rounded-2xl font-bold"
                onChange={(e) => { img = e.target.value; }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
            <div className="flex items-center gap-3">
              <Switch id="swal-edit-featured" defaultChecked={featured} onCheckedChange={(val) => { featured = val; }} />
              <Label htmlFor="swal-edit-featured" className="text-[10px] font-black text-text-muted uppercase tracking-widest cursor-pointer">تمييز الوجهة</Label>
            </div>
            <Star className={cn("h-5 w-5", featured ? "text-warning fill-warning" : "text-text-muted opacity-40")} />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'اعتماد التغييرات',
      cancelButtonText: 'إلغاء التعديل',
      background: 'var(--card)',
      color: 'var(--text-main)',
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.3)]',
        confirmButton: 'bg-primary text-white rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all',
        cancelButton: 'bg-muted text-text-main rounded-2xl px-10 py-4 font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all',
      },
      preConfirm: async () => {
        if (!name.trim()) {
          Swal.showValidationMessage('يرجى إدخال اسم الوجهة');
          return false;
        }
        try {
          await updateDoc(doc(db, 'cities', city.id), {
            name,
            city_img: img,
            isFeatured: featured
          });
          return true;
        } catch (error) {
          Swal.showValidationMessage('فشل في تحديث الوجهة');
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('تم تحديث بيانات الوجهة بنجاح');
      }
    });
  };

  const handleDeleteCity = async (id: string) => {
    const isConfirmed = await confirm('هل أنت متأكد؟', 'سيتم حذف هذه المدينة وجميع الفنادق والغرف التابعة لها نهائياً!');
    if (!isConfirmed) return;
    setLoading(true);
    try {
      // Internal code remains same...
      const hotelsSnap = await firestoreGetDocs(collection(db, 'cities', id, 'hotels'));
      for (const hotelDoc of hotelsSnap.docs) {
        const roomsSnap = await firestoreGetDocs(collection(db, 'cities', id, 'hotels', hotelDoc.id, 'rooms'));
        for (const roomDoc of roomsSnap.docs) {
          await deleteDoc(doc(db, 'cities', id, 'hotels', hotelDoc.id, 'rooms', roomDoc.id));
        }
        await deleteDoc(doc(db, 'cities', id, 'hotels', hotelDoc.id));
      }
      await deleteDoc(doc(db, 'cities', id));
      toast.success('تم حذف المدينة وجميع بياناتها بنجاح');
    } catch (error) {
      toast.error('فشل في حذف المدينة');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (city: City) => {
    try {
      await updateDoc(doc(db, 'cities', city.id), {
        isFeatured: !city.isFeatured
      });
    } catch (error) {
      toast.error('فشل في تحديث حالة الوجهة');
    }
  };

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [activeManager, setActiveManager] = useState<'hotels' | 'rooms' | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  if (activeManager === 'hotels' && selectedCity) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setActiveManager(null)} className="rounded-xl gap-2 font-bold shadow-sm">
          <ChevronRight className="h-4 w-4" />
          الرجوع للمدن
        </Button>
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-primary">إدارة فنادق {selectedCity.name}</h2>
            <p className="text-xs text-text-muted font-medium mt-1">تتم الآن إضافة الفنادق داخل هذه المدينة هرمياً.</p>
          </div>
          <Building2 className="h-8 w-8 text-primary opacity-20" />
        </div>
        <HotelManager overrideCityId={selectedCity.id} onManageRooms={(hotelId) => {
          setSelectedHotelId(hotelId);
          setActiveManager('rooms');
        }} />
      </div>
    );
  }

  if (activeManager === 'rooms' && selectedCity && selectedHotelId) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setActiveManager('hotels')} className="rounded-xl gap-2 font-bold shadow-sm">
          <ChevronRight className="h-4 w-4" />
          الرجوع للفنادق
        </Button>
        <div className="bg-success/5 p-4 rounded-2xl border border-success/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-success">إدارة الغرف</h2>
            <p className="text-xs text-text-muted font-medium mt-1">إضافة وإدارة الغرف داخل الفندق المختار.</p>
          </div>
          <Bed className="h-8 w-8 text-success opacity-20" />
        </div>
        <RoomManager overrideCityId={selectedCity.id} overrideHotelId={selectedHotelId} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-text-main tracking-tight gradient-text">إدارة الوجهات الجغرافية</h1>
          <p className="text-sm text-text-muted font-bold">تحكم في التمدد الجغرافي للمنصة وخصص المعايير لكل مدينة.</p>
        </div>
        <Button 
          onClick={openAddCitySwal}
          className="btn-premium h-14 px-8 rounded-2xl gap-3 shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" />
          <span className="font-black text-xs uppercase tracking-widest">إضافة وجهة جديدة</span>
        </Button>
      </div>

      <div className="premium-card bg-card overflow-hidden">
        <div className="px-10 py-8 border-b border-border/40 flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-75">
              <MapPin className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-text-main">خريطة الوجهات النشطة</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="table-premium">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[45%]">الوجهة والتصنيف</TableHead>
                <TableHead>معاينة بصرية</TableHead>
                <TableHead>الظهور المميز</TableHead>
                <TableHead className="text-left">مركز التحكم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                        {city.name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-text-main text-lg tracking-tight group-hover:text-primary transition-colors">{city.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] items-center flex gap-1 font-black text-text-muted uppercase tracking-widest opacity-60 italic">
                            <Building2 className="h-3 w-3" /> محفظة الأصول المدارة
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative w-20 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-500 bg-muted">
                      {city.city_img ? (
                        <img src={city.city_img} alt={city.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-text-muted">
                          <ImageIcon className="h-5 w-5 opacity-20" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={city.isFeatured} onCheckedChange={() => toggleFeatured(city)} className="data-[state=checked]:bg-warning" />
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openEditCitySwal(city)}
                        className="h-11 w-11 rounded-2xl bg-muted/50 border-border/40 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedCity(city);
                          setActiveManager('hotels');
                        }}
                        className="h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary/5 text-primary border-primary/10 hover:bg-primary hover:text-white hover:shadow-lg transition-all gap-3"
                      >
                        <Building2 className="h-4 w-4" />
                        المنشآت
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteCity(city.id)} 
                        className="h-11 w-11 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive hover:scale-110"
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
