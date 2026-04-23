import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, Trash, Sparkles, Image as ImageIcon, X, Bed, Star, Cigarette, Maximize2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { City, Hotel, Room } from '@/src/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/lib/firebase';
import { collection, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { toast } from '@/src/lib/swal';

interface RoomFormProps {
  initialData?: Partial<Room>;
  cities: City[];
  hotels: Hotel[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const RoomForm: React.FC<RoomFormProps> = ({ 
  initialData, 
  cities, 
  hotels, 
  onSubmit, 
  onCancel,
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    Room_name: initialData?.Room_name || '',
    السعر: initialData?.السعر || '',
    الإطلالة: initialData?.الإطلالة || '',
    المرافق: initialData?.المرافق || [''],
    cityId: initialData?.cityId || '',
    hotelId: initialData?.hotelId || '',
    rating: initialData?.rating ?? 0,
    reviewsCount: initialData?.reviewsCount || 0,
    isSmokingAllowed: initialData?.isSmokingAllowed ?? false,
    size: initialData?.size || '',
    bed: initialData?.bed || '',
    imageUrls: []
  });
  
  const [hoverRating, setHoverRating] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    isEdit ? (initialData?.Room_img || []) : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const [dynamicHotels, setDynamicHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);

  // Fetch hotels for the selected city dynamically to ensure stability
  useEffect(() => {
    if (!formData.cityId) {
      setDynamicHotels([]);
      return;
    }
    
    const fetchHotelsForCity = async () => {
      setHotelsLoading(true);
      try {
        const hSnap = await firestoreGetDocs(collection(db, 'cities', formData.cityId, 'hotels'));
        const list = hSnap.docs.map(doc => ({ id: doc.id, cityId: formData.cityId, ...doc.data() } as Hotel));
        setDynamicHotels(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      } catch (error) {
        console.error('Error fetching hotels for city:', error);
      } finally {
        setHotelsLoading(false);
      }
    };

    fetchHotelsForCity();
  }, [formData.cityId]);

  const displayHotels = dynamicHotels.length > 0 ? dynamicHotels : hotels.filter(h => h.cityId === formData.cityId);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file: File) => {
      const storageRef = ref(storage, `rooms/${Date.now()}_${file.name}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const allImages = [
        ...uploadedImages,
        ...formData.imageUrls.filter(url => url.trim() !== '')
      ];
      
      const { imageUrls, ...submitData } = formData;
      
      await onSubmit({
        ...submitData,
        Room_img: allImages,
        المرافق: formData.المرافق.filter(f => f.trim() !== ''),
        reviewsCount: Number(formData.reviewsCount) || 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDynamicField = (field: 'المرافق' | 'imageUrls', index: number, value: string) => {
    const newFields = [...formData[field]];
    newFields[index] = value;
    setFormData({ ...formData, [field]: newFields });
  };

  const addDynamicField = (field: 'المرافق' | 'imageUrls') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeDynamicField = (field: 'المرافق' | 'imageUrls', index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  };

  return (
    <form onSubmit={handleSubmit} className="text-right space-y-12 max-h-[70vh] overflow-y-auto px-4 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">الوجهة (المدينة)</Label>
            <Select 
              onValueChange={(v) => setFormData({...formData, cityId: v, hotelId: ''})} 
              value={formData.cityId}
              disabled={isEdit}
            >
              <SelectTrigger className="premium-input h-14 rounded-2xl px-6 font-bold text-right flex-row-reverse">
                <SelectValue placeholder="اختر مدينة" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl z-[10001]">
                {cities.length === 0 ? (
                  <div className="p-4 text-center text-xs font-bold text-text-muted">لا توجد مدن مضافة حالياً</div>
                ) : (
                  cities.map(city => (
                    <SelectItem key={city.id} value={city.id} className="rounded-xl my-1 font-bold text-right">
                      {city.name || `مدينة غير مسمى (${city.id.substring(0, 5)})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">المنشأة الفندقية</Label>
            <Select 
              onValueChange={(v) => setFormData({...formData, hotelId: v})} 
              value={formData.hotelId}
              disabled={!formData.cityId || isEdit || hotelsLoading}
            >
              <SelectTrigger className="premium-input h-14 rounded-2xl px-6 font-bold text-right flex-row-reverse disabled:opacity-30">
                <SelectValue placeholder={hotelsLoading ? "جاري التحميل..." : "اختر فندق"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl z-[10001]">
                {displayHotels.length === 0 ? (
                  <div className="p-4 text-center text-xs font-bold text-text-muted">
                    {hotelsLoading ? "جاري البحث عن فنادق..." : "لا توجد فنادق مضافة في هذه المدينة"}
                  </div>
                ) : (
                  displayHotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id} className="font-bold rounded-xl my-1 text-right">
                      {hotel.name || `فندق بدون اسم (${hotel.id.substring(0, 5)})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">هوية الغرفة / الجناح</Label>
            <Input 
              value={formData.Room_name} 
              onChange={(e) => setFormData({...formData, Room_name: e.target.value})} 
              className="premium-input h-14 rounded-2xl text-base font-black px-6 text-right"
              placeholder="مثل: جناح ملكي مطل على البحر"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">التسعير الليلي</Label>
            <div className="relative group">
              <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-success group-focus-within:scale-110 transition-transform" />
              <Input 
                value={formData.السعر} 
                onChange={(e) => setFormData({...formData, السعر: e.target.value})} 
                className="premium-input h-14 pr-12 rounded-2xl font-black text-xl text-success text-right"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border/40">
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">الزوايا البصرية (الإطلالة)</Label>
            <div className="relative group">
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <Input 
                value={formData.الإطلالة} 
                onChange={(e) => setFormData({...formData, الإطلالة: e.target.value})} 
                className="premium-input h-14 pr-12 rounded-2xl font-bold text-right"
                placeholder="إطلالة بحرية، جبلية، بانورامية..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">تقييم الغرفة (Stars)</Label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1 flex-row-reverse justify-end">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFull = star <= (hoverRating || formData.rating);
                  const isHalf = !isFull && (star - 0.5) <= (hoverRating || formData.rating);
                  
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-all duration-150 focus:outline-none p-1 relative"
                    >
                      <Star
                        className={`h-8 w-8 transition-all duration-150 ${
                          isFull || isHalf
                            ? 'fill-amber-400 text-amber-400 scale-110'
                            : 'text-border fill-transparent'
                        }`}
                        style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                      />
                      {isHalf && (
                        <Star
                          className="h-8 w-8 text-border fill-transparent absolute top-1 right-1"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative w-32">
                  <Star className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                  <Input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating} 
                    onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})} 
                    className="premium-input h-10 pr-9 rounded-xl font-black text-center"
                    placeholder="4.5"
                  />
                </div>
                <span className="text-sm font-black text-text-muted">
                  {formData.rating > 0 ? `${formData.rating.toFixed(1)} / 5` : 'لم يُحدد'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">عدد المراجعات (Reviews Count)</Label>
            <div className="relative group">
              <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <Input 
                type="number"
                value={formData.reviewsCount} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({...formData, reviewsCount: val === '' ? 0 : parseInt(val)});
                }} 
                className="premium-input h-14 pr-12 rounded-2xl font-black text-right"
                placeholder="مثال: 85"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">مساحة الغرفة (م²)</Label>
              <div className="relative group">
                <Maximize2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <Input 
                  value={formData.size} 
                  onChange={(e) => setFormData({...formData, size: e.target.value})} 
                  className="premium-input h-14 pr-12 rounded-2xl font-bold text-right"
                  placeholder="مثال: 35"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">عدد الأسرة</Label>
              <div className="relative group">
                <Bed className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
                <Input 
                  value={formData.bed} 
                  onChange={(e) => setFormData({...formData, bed: e.target.value})} 
                  className="premium-input h-14 pr-12 rounded-2xl font-bold text-right"
                  placeholder="مثال: 2"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">سياسة التدخين</Label>
            <div className="flex items-center gap-4 flex-row-reverse justify-end">
              <div 
                onClick={() => setFormData({...formData, isSmokingAllowed: true})}
                className={`flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all cursor-pointer font-bold ${
                  formData.isSmokingAllowed 
                    ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' 
                    : 'border-border/40 text-text-muted hover:border-border'
                }`}
              >
                <Cigarette className="h-5 w-5" />
                <span>مسموح بالتدخين</span>
              </div>
              <div 
                onClick={() => setFormData({...formData, isSmokingAllowed: false})}
                className={`flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all cursor-pointer font-bold ${
                  !formData.isSmokingAllowed 
                    ? 'border-destructive bg-destructive/10 text-destructive shadow-lg shadow-destructive/10' 
                    : 'border-border/40 text-text-muted hover:border-border'
                }`}
              >
                <X className="h-5 w-5" />
                <span>ممنوع التدخين</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">خدمات الرفاهية (Facilities)</Label>
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {formData.المرافق.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-3 flex-row-reverse">
                  <Input 
                    value={item} 
                    onChange={(e) => updateDynamicField('المرافق', index, e.target.value)} 
                    className="premium-input h-12 rounded-xl px-6 font-bold text-right"
                    placeholder="مرفق..."
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicField('المرافق', index)} className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl">
                    <Trash className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button type="button" variant="outline" onClick={() => addDynamicField('المرافق')} className="h-12 border-dashed border-2 border-primary/20 text-[10px] font-black rounded-xl hover:bg-primary/5 hover:border-primary/40 text-primary transition-all flex-row-reverse">
              <Plus className="h-4 w-4 mr-2" /> إضافة مرفق جديد
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-border/40">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="space-y-1 text-right">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">الأصول المرئية</Label>
            <p className="text-[9px] text-text-muted font-bold">رفع صور عالية الدقة أو إضافة روابط خارجية</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef}
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <Button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-premium px-6 h-12 rounded-xl flex items-center gap-2 text-[10px] font-black shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" /> حَمِّل من الجهاز
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={() => addDynamicField('imageUrls')}
              className="px-6 h-12 rounded-xl flex items-center gap-2 text-[10px] font-black border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all"
            >
              <ImageIcon className="h-4 w-4" /> أضف رابط صورة
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 flex-row-reverse">
          <AnimatePresence>
            {uploadedImages.map((url, index) => (
              <motion.div key={`up-${index}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border/40 group shadow-lg">
                <img src={url} alt="Room" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))} className="absolute inset-0 bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <Trash className="h-6 w-6" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6 pt-6">
          {formData.imageUrls.length > 0 && (
            <>
              <div className="flex items-center justify-between flex-row-reverse">
                <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">روابط الصور الخارجية المضافة</Label>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {formData.imageUrls.map((url, index) => (
                    <motion.div key={`link-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40">
                      <div className="flex-grow space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            value={url} 
                            onChange={(e) => updateDynamicField('imageUrls', index, e.target.value)} 
                            className="premium-input h-12 rounded-xl px-4 font-bold text-left ltr"
                            placeholder="https://example.com/image.jpg"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicField('imageUrls', index)} className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {url.trim() !== '' && (
                        <div className="w-full sm:w-24 aspect-square rounded-xl overflow-hidden border-2 border-border/40 shrink-0">
                          <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=Invalid+URL')} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-10 flex items-center justify-end gap-5">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-14 px-10 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
          إلغاء الأمر
        </Button>
        <Button 
          type="submit" 
          disabled={submitting} 
          className="btn-premium h-14 px-16 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30"
        >
          {submitting ? 'جاري الحفظ...' : (isEdit ? 'تحديث البيانات' : 'اعتماد الغرفة الجديدة')}
        </Button>
      </div>
    </form>
  );
};
