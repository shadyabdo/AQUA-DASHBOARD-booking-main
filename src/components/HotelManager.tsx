import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, orderBy, updateDoc, collectionGroup, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/src/lib/firestoreErrorHandler';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/lib/firebase';
import { City, Hotel } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Hotel as HotelIcon, Image as ImageIcon, MapPin, Sparkles, Edit2, ChevronLeft, ChevronRight, X, Search, Minus, Bed, Zap, Coffee, Shield, Star } from 'lucide-react';
import MySwal, { toast, confirm } from '@/src/lib/swal';
// RTL helper for SweetAlert2 popups
const applyRTL = (popup: HTMLElement) => {
  popup.style.direction = 'rtl';
  const els = popup.querySelectorAll<HTMLElement>('.swal2-title, .swal2-html-container, .swal2-content');
  els.forEach(el => { el.style.textAlign = 'center'; el.style.direction = 'rtl'; });
};
import { HotelForm } from './forms/HotelForm';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HotelManagerProps {
  overrideCityId?: string;
  onManageRooms?: (hotelId: string) => void;
}

export const HotelManager: React.FC<HotelManagerProps> = ({ overrideCityId, onManageRooms }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cityId: overrideCityId || '',
    imageUrls: [''],
    المرافق: [''],
    الإطلالة: '',
    freeCancellation: false,
    rating: 0,
    reviewsCount: 0,
    mapUrl: ''
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    cityId: '',
    imageUrls: [''],
    المرافق: [''],
    الإطلالة: '',
    freeCancellation: false
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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

      // 2. Fetch hotels
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
             console.warn('HotelManager: collectionGroup failed, using crawl fallback', cgErr);
             const citiesSnap = await firestoreGetDocs(collection(db, 'cities'));
             const allHotels: Hotel[] = [];
             for (const cityDoc of citiesSnap.docs) {
               try {
                 const hSnap = await firestoreGetDocs(collection(db, 'cities', cityDoc.id, 'hotels'));
                 hSnap.docs.forEach(hDoc => {
                   allHotels.push({ id: hDoc.id, cityId: cityDoc.id, ...hDoc.data() } as Hotel);
                 });
               } catch (e) { /* skip if inaccessible */ }
             }
             setHotels(allHotels.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
          }
        }
      } catch (err) {
        console.error('HotelManager: Load failed', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [overrideCityId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file: File) => {
      const storageRef = ref(storage, `hotels/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);
      toast.success(`تم رفع ${urls.length} صور`);
    } catch (error) {
      console.error(error);
      toast.error('فشل في رفع الصور');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addImageUrlField = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
    } else {
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
    }
  };

  const removeImageUrlField = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
    } else {
      setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
    }
  };

  const updateImageUrlField = (index: number, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      const newUrls = [...editFormData.imageUrls];
      newUrls[index] = value;
      setEditFormData(prev => ({ ...prev, imageUrls: newUrls }));
    } else {
      const newUrls = [...formData.imageUrls];
      newUrls[index] = value;
      setFormData(prev => ({ ...prev, imageUrls: newUrls }));
    }
  };

  const addDynamicField = (field: 'المرافق', isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    } else {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    }
  };

  const removeDynamicField = (field: 'المرافق', index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    }
  };

  const updateDynamicField = (field: 'المرافق', index: number, value: string, isEdit: boolean = false) => {
    if (isEdit) {
      const newValues = [...editFormData[field]];
      newValues[index] = value;
      setEditFormData(prev => ({ ...prev, [field]: newValues }));
    } else {
      const newValues = [...formData[field]];
      newValues[index] = value;
      setFormData(prev => ({ ...prev, [field]: newValues }));
    }
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cityId) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      let mapUrl = formData.mapUrl;
      if (mapUrl.includes('<iframe')) {
        const match = mapUrl.match(/src="([^"]+)"/);
        if (match && match[1]) {
          mapUrl = match[1];
        }
      }

      const allImages = [
        ...uploadedImages,
        ...formData.imageUrls.filter(url => url.trim() !== '')
      ];
      
      const hotelData = {
        name: formData.name,
        description: formData.description,
        cityId: formData.cityId,
        images: allImages,
        Hotel_img: allImages, // backward compat
        amenities: formData.المرافق.filter(f => f.trim() !== ''),
        المرافق: formData.المرافق.filter(f => f.trim() !== ''), // backward compat
        الإطلالة: formData.الإطلالة,
        freeCancellation: formData.freeCancellation,
        rating: formData.rating,
        reviewsCount: formData.reviewsCount,
        mapUrl: mapUrl || ''
      };

      await addDoc(collection(db, 'cities', formData.cityId, 'hotels'), hotelData);

      setFormData({ 
        name: '', 
        description: '',
        cityId: overrideCityId || '', 
        imageUrls: [''],
        المرافق: [''],
        الإطلالة: '',
        freeCancellation: false,
        rating: 0,
        reviewsCount: 0,
        mapUrl: ''
      });
      setUploadedImages([]);
      toast.success('تم إضافة الفندق بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('فشل في إضافة الفندق');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (hotel: Hotel) => {
    const isConfirmed = await confirm('هل أنت متأكد؟', 'سيتم حذف هذا الفندق وجميع البيانات المرتبطة به!');
    if (!isConfirmed) return;
    setLoading(true);
    try {
      if (hotel.cityId) {
        // Delete nested rooms first
        const roomsSnap = await firestoreGetDocs(collection(db, 'cities', hotel.cityId, 'hotels', hotel.id, 'rooms'));
        for (const roomDoc of roomsSnap.docs) {
          await deleteDoc(doc(db, 'cities', hotel.cityId, 'hotels', hotel.id, 'rooms', roomDoc.id));
        }
        // Delete hotel
        await deleteDoc(doc(db, 'cities', hotel.cityId, 'hotels', hotel.id));
      } else {
        // Fallback for old structure
        await deleteDoc(doc(db, 'hotels', hotel.id));
      }
      toast.success('تم حذف الفندق وجميع بياناته بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('فشل في حذف الفندق');
    } finally {
      setLoading(false);
    }
  };

  const openEditHotelSwal = (hotel: Hotel) => {
    MySwal.fire({
      html: (
        <div className="p-8">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-90">
              <Star className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black tracking-tight text-text-main">تعديل المنشأة الفندقية</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">نظام إدارة الأصول الموحد</p>
            </div>
          </div>
          <HotelForm 
            cities={cities} 
            initialData={hotel}
            isEdit={true}
            onSubmit={async (data) => {
              setLoading(true);
              try {
                if (hotel.cityId === data.cityId) {
                  await updateDoc(doc(db, 'cities', data.cityId, 'hotels', hotel.id), data);
                } else {
                  if (hotel.cityId) {
                    await deleteDoc(doc(db, 'cities', hotel.cityId, 'hotels', hotel.id));
                  } else {
                    await deleteDoc(doc(db, 'hotels', hotel.id));
                  }
                  await addDoc(collection(db, 'cities', data.cityId, 'hotels'), data);
                }
                toast.success('تم تحديث الفندق بنجاح');
                MySwal.close();
              } catch (error) {
                console.error(error);
                toast.error('فشل في تحديث الفندق');
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
      setViewerZoom(prev => Math.max(0.5, prev - 0.1));
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

  const filteredHotels = hotels.filter(hotel => 
    (hotel.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">إدارة الفنادق</h1>
        <p className="text-sm text-text-muted">إدارة المنشآت الفندقية والمنتجعات في مختلف المدن.</p>
      </div>

      <Card className="premium-card">
        <CardHeader className="px-6 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <HotelIcon className="h-5 w-5 text-primary" />
            إضافة فندق جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleAddHotel} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-text-muted">اسم الفندق</Label>
              <Input 
                placeholder="اسم الفندق" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="premium-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-text-muted">وصف الفندق</Label>
              <Input 
                placeholder="وصف مختصر للفندق..." 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="premium-input"
              />
            </div>
            {!overrideCityId && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-text-muted">المدينة</Label>
                <Select onValueChange={(v) => setFormData({...formData, cityId: v})} value={formData.cityId}>
                  <SelectTrigger className="premium-input">
                    <SelectValue placeholder="اختر مدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المرافق */}
                <div className="space-y-4">
                  <Label className="text-xs font-bold text-text-muted">المرافق</Label>
                  <div className="space-y-2">
                    {formData.المرافق.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          placeholder="مرفق" 
                          value={item} 
                          onChange={(e) => updateDynamicField('المرافق', index, e.target.value)} 
                          className="premium-input h-10"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicField('المرافق', index)} className="h-10 w-10 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => addDynamicField('المرافق')} className="w-full h-10 border-dashed text-xs font-bold">
                      <Plus className="h-4 w-4 mr-2" /> إضافة مرفق
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-text-muted">الإطلالة</Label>
                  <Input 
                    placeholder="إطلالة الفندق" 
                    value={formData.الإطلالة} 
                    onChange={(e) => setFormData({...formData, الإطلالة: e.target.value})} 
                    className="premium-input"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-text-muted">التقييم (1-5)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="التقييم" 
                    value={formData.rating} 
                    onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})} 
                    className="premium-input"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-text-muted">عدد التقييمات</Label>
                  <Input 
                    type="number"
                    placeholder="عدد المراجعات" 
                    value={formData.reviewsCount} 
                    onChange={(e) => setFormData({...formData, reviewsCount: Number(e.target.value)})} 
                    className="premium-input"
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <Label className="text-xs font-bold text-text-muted flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    رابط الموقع على Google Maps
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <Input 
                      placeholder="https://maps.google.com/..."
                      value={formData.mapUrl}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.includes('<iframe')) {
                          const match = val.match(/src="([^"]+)"/);
                          if (match && match[1]) {
                            val = match[1];
                          }
                        }
                        setFormData({...formData, mapUrl: val});
                      }}
                      className="premium-input pr-10"
                      dir="ltr"
                    />
                  </div>
                  {formData.mapUrl && (
                    <a
                      href={formData.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-bold text-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3" /> معاينة الموقع على الخريطة
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-text-main">سياسة الإلغاء المرنة</h4>
                    <p className="text-[10px] text-text-muted font-medium">تفعيل إمكانية استرداد الأموال للعملاء.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="free-cancel" 
                    checked={formData.freeCancellation} 
                    onCheckedChange={(c) => setFormData({...formData, freeCancellation: c})} 
                  />
                  <Label htmlFor="free-cancel" className="text-xs font-bold text-text-muted cursor-pointer">إلغاء مجاني</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold text-text-muted">روابط الصور</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <Input 
                        placeholder="رابط الصورة..." 
                        value={url} 
                        onChange={(e) => updateImageUrlField(index, e.target.value)} 
                        className="premium-input pr-10"
                      />
                      {formData.imageUrls.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeImageUrlField(index)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => addImageUrlField()}
                    className="w-full h-11 border-dashed text-xs font-bold"
                  >
                    <Plus className="h-4 w-4 mr-2" /> إضافة رابط صورة
                  </Button>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold text-text-muted">رفع الصور</Label>
                <div className="flex flex-wrap gap-4 bg-muted/50 p-4 rounded-lg border border-border/50">
                  <AnimatePresence>
                    {uploadedImages.map((url, index) => (
                      <motion.div 
                        key={url} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group"
                      >
                        <img src={url} alt="Hotel" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-all">
                    <ImageIcon className="h-6 w-6 text-text-muted mb-1" />
                    <span className="text-[10px] font-bold text-text-muted">رفع صورة</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
                {uploading && <p className="text-[10px] text-primary font-bold animate-pulse">جاري الرفع...</p>}
              </div>
              <Button type="submit" className="btn-premium w-full h-12 rounded-lg" disabled={loading || uploading}>
                {loading ? 'جاري الحفظ...' : 'إضافة الفندق'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="premium-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <HotelIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">
              سجل الفنادق 
              {hotels.length > 0 && <span className="mr-2 text-xs text-primary/60 font-medium">({hotels.length})</span>}
            </h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setLoading(true);
                // Trigger the logic in useEffect by just resetting loading
              }}
              className="h-9 px-3 rounded-lg text-[10px] font-bold gap-2"
              disabled={loading}
            >
              <Sparkles className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
            {loading && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 px-3 py-1 rounded-full animate-pulse">
                جاري المزامنة...
              </div>
            )}
            <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="البحث..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm font-bold bg-card"
            />
          </div>
        </div>
      </div>
        <div className="overflow-x-auto">
          <Table className="table-premium">
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>التقييم</TableHead>
                <TableHead>الصور</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHotels.map((hotel) => (
                <TableRow key={hotel.id} className="group">
                  <TableCell>
                    <span className="font-bold text-text-main">{hotel.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                      <MapPin className="h-3 w-3" />
                      {cities.find(c => c.id === hotel.cityId)?.name || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {hotel.rating && hotel.rating > 0 ? (
                        Array.from({ length: 5 }).map((_, i) => {
                          const starValue = i + 1;
                          const isFull = starValue <= hotel.rating!;
                          const isHalf = !isFull && (starValue - 0.5) <= hotel.rating!;
                          
                          return (
                            <div key={i} className="relative">
                              <Star
                                className={`h-3.5 w-3.5 ${
                                  isFull || isHalf
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-border fill-transparent'
                                }`}
                                style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                              />
                              {isHalf && (
                                <Star
                                  className="h-3.5 w-3.5 text-border fill-transparent absolute inset-0"
                                />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-text-muted font-bold">—</span>
                      )}
                    </div>
                    {hotel.reviewsCount !== undefined && (
                      <span className="text-[9px] font-black text-text-muted mt-1.5 mr-0.5">
                        ({hotel.reviewsCount} تقييم)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2 rtl:space-x-reverse cursor-pointer" onClick={() => openViewer(hotel.Hotel_img || [])}>
                      {hotel.Hotel_img?.slice(0, 3).map((img, i) => (
                        <img key={i} src={img} className="w-8 h-8 rounded-lg border-2 border-card object-cover" referrerPolicy="no-referrer" />
                      ))}
                      {(hotel.Hotel_img?.length || 0) > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-[10px] font-bold border-2 border-card">
                          +{(hotel.Hotel_img?.length || 0) - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-start gap-2">
                      {onManageRooms && (
                        <Button variant="outline" size="sm" onClick={() => onManageRooms(hotel.id)} className="h-8 px-3 rounded-lg text-[10px] font-bold gap-2">
                          <Bed className="h-3 w-3" />
                          الغرف
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditHotelSwal(hotel)} className="h-8 w-8 rounded-lg">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteHotel(hotel)} className="h-8 w-8 rounded-lg text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent showCloseButton={false} className="w-[500px] max-w-[500px] h-[85vh] p-0 border-none bg-black/95 backdrop-blur-2xl rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">معاينة الملفات</span>
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
