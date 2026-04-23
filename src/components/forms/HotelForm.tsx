import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Hotel as HotelIcon, Image as ImageIcon, MapPin, Sparkles, Trash2, Zap, Shield, Plus, X, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { City, Hotel } from '@/src/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/src/lib/firebase';
import { toast } from '@/src/lib/swal';
import { cn } from '@/lib/utils';

interface HotelFormProps {
  initialData?: Partial<Hotel>;
  cities: City[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const HotelForm: React.FC<HotelFormProps> = ({ 
  initialData, 
  cities, 
  onSubmit, 
  onCancel,
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    cityId: initialData?.cityId || '',
    imageUrls: [],
    المرافق: initialData?.المرافق || [''],
    الإطلالة: initialData?.الإطلالة || '',
    freeCancellation: initialData?.freeCancellation || false,
    rating: initialData?.rating ?? 0,
    reviewsCount: initialData?.reviewsCount || 0,
    mapUrl: initialData?.mapUrl || ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    isEdit ? (initialData?.Hotel_img || []) : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
      
      const { imageUrls, ...submitData } = formData;
      
      await onSubmit({
        ...submitData,
        mapUrl,
        Hotel_img: allImages,
        المرافق: formData.المرافق.filter(f => f.trim() !== ''),
        reviewsCount: Number(formData.reviewsCount) || 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData({ ...formData, imageUrls: newUrls });
  };

  const addImageUrlField = () => {
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
  };

  const removeImageUrlField = (index: number) => {
    setFormData({ ...formData, imageUrls: formData.imageUrls.filter((_, i) => i !== index) });
  };

  return (
    <form onSubmit={handleSubmit} className="text-right space-y-12 max-h-[70vh] overflow-y-auto px-4 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">هوية الفندق</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="premium-input h-14 rounded-2xl text-base font-black px-6 text-right"
              placeholder="اسم الفندق الرسمي..."
            />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">النطاق الجغرافي</Label>
            <Select onValueChange={(v) => setFormData({...formData, cityId: v})} value={formData.cityId}>
              <SelectTrigger className="premium-input h-14 rounded-2xl px-6 font-bold text-right flex-row-reverse">
                <SelectValue placeholder="اختر المدينة المستضيفة" />
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
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">التوصيف الفندقي</Label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
            className="premium-input w-full min-h-[145px] p-6 resize-none rounded-3xl font-bold leading-relaxed text-right"
            placeholder="اكتب وصفاً جذاباً يتحدث عن مميزات وخدمات الفندق..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border/40">
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">الزوايا البصرية (الإطلالة)</Label>
            <div className="relative group">
              <Zap className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <Input 
                value={formData.الإطلالة} 
                onChange={(e) => setFormData({...formData, الإطلالة: e.target.value})} 
                className="premium-input h-14 pr-12 rounded-2xl font-bold text-right"
                placeholder="مثل: إطلالة بانورامية على النيل"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">رابط الموقع على Google Maps</Label>
            <div className="relative group">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-primary transition-colors" />
              <Input 
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
                className="premium-input h-14 pr-12 rounded-2xl font-bold text-right"
                placeholder="https://maps.google.com/..."
                dir="ltr"
              />
            </div>
            {formData.mapUrl && (
              <a
                href={formData.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" /> معاينة الموقع على الخريطة
              </a>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">تقييم الفندق (Stars)</Label>
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
                placeholder="مثال: 124"
              />
            </div>
          </div>
          
          <div className="relative group overflow-hidden rounded-[2rem] p-8 bg-muted/20 border border-border/40 hover:bg-muted/40 transition-all cursor-pointer" onClick={() => setFormData({...formData, freeCancellation: !formData.freeCancellation})}>
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className={cn(
                  "stat-icon-glow mb-0 transition-colors",
                  formData.freeCancellation ? "bg-success/10 text-success" : "bg-text-muted/10 text-text-muted"
                )}>
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-1 text-right">
                  <h4 className="text-sm font-black text-text-main">سياسة الإلغاء المرنة</h4>
                  <p className="text-[10px] text-text-muted font-bold">تفعيل استرداد الأموال بالكامل للعملاء</p>
                </div>
              </div>
              <Switch checked={formData.freeCancellation} onCheckedChange={(c) => setFormData({...formData, freeCancellation: c})} className="data-[state=checked]:bg-success" />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2">مرافق الخدمة المميزة</Label>
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {formData.المرافق.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-3 flex-row-reverse">
                  <Input 
                    value={item} 
                    onChange={(e) => {
                      const newVals = [...formData.المرافق];
                      newVals[index] = e.target.value;
                      setFormData({...formData, المرافق: newVals});
                    }} 
                    className="premium-input h-12 rounded-xl px-6 font-bold text-right"
                    placeholder="مرفق..."
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => {
                    setFormData({...formData, المرافق: formData.المرافق.filter((_, i) => i !== index)});
                  }} className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button type="button" variant="outline" onClick={() => setFormData({...formData, المرافق: [...formData.المرافق, '']})} className="h-12 border-dashed border-2 border-primary/20 text-[10px] font-black rounded-xl hover:bg-primary/5 hover:border-primary/40 text-primary transition-all flex-row-reverse">
              <Plus className="h-4 w-4 mr-2" /> إضافة مرفق جديد
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t border-border/40">
        <div className="flex items-center justify-between flex-row-reverse">
          <div className="space-y-1 text-right">
            <Label className="text-[10px] font-black uppercase tracking-widest text-text-muted">الأصول المرئية</Label>
            <p className="text-[9px] text-text-muted font-bold">رفع صور عالية الدقة أو إضافة روابط CDN مباشرة</p>
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
              onClick={addImageUrlField}
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
                <img src={url} alt="Hotel" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))} className="absolute inset-0 bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <Trash2 className="h-6 w-6" />
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
                            onChange={(e) => updateImageUrl(index, e.target.value)} 
                            className="premium-input h-12 rounded-xl px-4 font-bold text-left ltr"
                            placeholder="https://example.com/image.jpg"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeImageUrlField(index)} className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl">
                            <Trash2 className="h-4 w-4" />
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
          disabled={submitting || uploading} 
          className="btn-premium h-14 px-16 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30"
        >
          {submitting ? 'جاري الحفظ...' : (isEdit ? 'تحديث البيانات' : 'إضافة الفندق')}
        </Button>
      </div>
    </form>
  );
};
