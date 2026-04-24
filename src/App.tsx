/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthGuard } from './lib/AuthGuard';
import { CityManager } from './components/CityManager';
import { CityDashboardView } from './components/CityDashboardView';
import { HotelManager } from './components/HotelManager';
import { RoomManager } from './components/RoomManager';
import { BookingManager } from './components/BookingManager';
import { ArticleManager } from './components/ArticleManager';
import { CouponManager } from './components/CouponManager';
import { SystemMaintenance } from './components/SystemMaintenance';
import { GlobalRoomView } from './components/GlobalRoomView';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from './lib/swal';
import { 
  LayoutDashboard, 
  MapPin, 
  Hotel, 
  Bed, 
  Calendar, 
  LogOut,
  Building2,
  Menu,
  X,
  ChevronRight,
  Search,
  Settings,
  Compass,
  Briefcase,
  Users,
  Bell,
  Star,
  Heart,
  Shield,
  Zap,
  Globe,
  Camera,
  Music,
  Video,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  BarChart3,
  PieChart,
  TrendingUp,
  Award,
  Bookmark,
  Coffee,
  Utensils,
  Plane,
  Car,
  Bike,
  ShoppingBag,
  CreditCard,
  Wallet,
  Key,
  Lock,
  Eye,
  Flag,
  Tag,
  Gift,
  Smile,
  Sun,
  Moon,
  Cloud,
  Umbrella,
  Wind,
  Flame,
  Droplets,
  Leaf,
  Trees,
  Mountain,
  Waves,
  Palette,
  Scissors,
  PenTool,
  Brush,
  Eraser,
  Type,
  Layers,
  Component,
  Box,
  Package,
  Truck,
  HardDrive,
  Cpu,
  MousePointer2,
  Keyboard,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Tv,
  Speaker,
  Headphones,
  Mic,
  Cast,
  Bluetooth,
  Wifi,
  Battery,
  Plug,
  Power,
  Trash,
  Share2,
  Link,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  History,
  Timer,
  Watch,
  AlarmClock,
  Hourglass,
  CalendarDays,
  CalendarRange,
  Map,
  Navigation,
  Locate,
  Compass as CompassIcon,
  Tent,
  Palmtree,
  Sailboat,
  Anchor,
  LifeBuoy,
  Target,
  Trophy,
  Medal,
  Activity,
  HeartPulse,
  Stethoscope,
  Thermometer,
  Pill,
  Syringe,
  Microscope,
  Dna,
  FlaskConical,
  TestTube2,
  GraduationCap,
  Book,
  BookOpen,
  Library,
  School,
  University,
  Lightbulb,
  Brain,
  Puzzle,
  Gamepad2,
  Ghost,
  Skull,
  Dices,
  Ticket,
  Clapperboard,
  Theater,
  Mic2,
  Music2,
  Disc,
  Radio,
  Antenna,
  Satellite,
  Rocket,
  Telescope,
  Atom,
  Binary,
  Code,
  Terminal,
  Database,
  Server,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudMoon,
  Sunrise,
  Sunset,
  ThermometerSnowflake,
  ThermometerSun,
  Wind as WindIcon,
  Cloudy,
  Tornado,
  Waves as WavesIcon,
  Sprout,
  Flower,
  Flower2,
  Citrus,
  Apple,
  Beef,
  Cake,
  Candy,
  Cherry,
  Cookie,
  Croissant,
  Egg,
  Fish,
  IceCream,
  Pizza,
  Popcorn,
  Soup,
  Wine,
  Beer,
  GlassWater,
  CupSoda,
  Baby,
  Footprints,
  Hand,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Nfc,
  Rss,
  Share,
  Send,
  Paperclip,
  StickyNote,
  Clipboard,
  Archive,
  Folder,
  FolderOpen,
  File,
  Files,
  Image,
  Images,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Star as StarIcon,
  Sparkle,
  Sparkles as SparklesIcon,
  Zap as ZapIcon,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Move,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Plus as PlusIcon,
  Newspaper,
  Megaphone,
  Minus,
  Divide,
  Equal,
  Percent,
  Hash,
  AtSign,
  Info as InfoIcon,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle as XCircleIcon,
  MoreHorizontal,
  MoreVertical,
  GripHorizontal,
  GripVertical
} from 'lucide-react';
import { auth, db } from './lib/firebase';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, collectionGroup, getDocFromServer, doc, getDocs as firestoreGetDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

const availableIcons = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'MapPin', icon: MapPin },
  { name: 'Hotel', icon: Hotel },
  { name: 'Bed', icon: Bed },
  { name: 'Calendar', icon: Calendar },
  { name: 'Settings', icon: Settings },
  { name: 'Compass', icon: Compass },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Users', icon: Users },
  { name: 'Bell', icon: Bell },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Shield', icon: Shield },
  { name: 'Zap', icon: Zap },
  { name: 'Globe', icon: Globe },
  { name: 'Camera', icon: Camera },
  { name: 'Music', icon: Music },
  { name: 'Video', icon: Video },
  { name: 'FileText', icon: FileText },
  { name: 'Mail', icon: Mail },
  { name: 'Phone', icon: Phone },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'BarChart', icon: BarChart3 },
  { name: 'PieChart', icon: PieChart },
  { name: 'Trending', icon: TrendingUp },
  { name: 'Award', icon: Award },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'Coffee', icon: Coffee },
  { name: 'Utensils', icon: Utensils },
  { name: 'Plane', icon: Plane },
  { name: 'Car', icon: Car },
  { name: 'Bike', icon: Bike },
  { name: 'Shopping', icon: ShoppingBag },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Wallet', icon: Wallet },
  { name: 'Key', icon: Key },
  { name: 'Lock', icon: Lock },
  { name: 'Eye', icon: Eye },
  { name: 'Flag', icon: Flag },
  { name: 'Tag', icon: Tag },
  { name: 'Gift', icon: Gift },
  { name: 'Smile', icon: Smile },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Cloud', icon: Cloud },
  { name: 'Umbrella', icon: Umbrella },
  { name: 'Wind', icon: Wind },
  { name: 'Flame', icon: Flame },
  { name: 'Droplets', icon: Droplets },
  { name: 'Leaf', icon: Leaf },
  { name: 'Trees', icon: Trees },
  { name: 'Mountain', icon: Mountain },
  { name: 'Waves', icon: Waves },
  { name: 'Palette', icon: Palette },
  { name: 'Scissors', icon: Scissors },
  { name: 'PenTool', icon: PenTool },
  { name: 'Brush', icon: Brush },
  { name: 'Eraser', icon: Eraser },
  { name: 'Type', icon: Type },
  { name: 'Layers', icon: Layers },
  { name: 'Component', icon: Component },
  { name: 'Box', icon: Box },
  { name: 'Package', icon: Package },
  { name: 'Truck', icon: Truck },
  { name: 'HardDrive', icon: HardDrive },
  { name: 'Cpu', icon: Cpu },
  { name: 'Mouse', icon: MousePointer2 },
  { name: 'Keyboard', icon: Keyboard },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Tablet', icon: Tablet },
  { name: 'Laptop', icon: Laptop },
  { name: 'Monitor', icon: Monitor },
  { name: 'Tv', icon: Tv },
  { name: 'Speaker', icon: Speaker },
  { name: 'Headphones', icon: Headphones },
  { name: 'Mic', icon: Mic },
  { name: 'Cast', icon: Cast },
  { name: 'Bluetooth', icon: Bluetooth },
  { name: 'Wifi', icon: Wifi },
  { name: 'Battery', icon: Battery },
  { name: 'Plug', icon: Plug },
  { name: 'Power', icon: Power },
  { name: 'Trash', icon: Trash },
  { name: 'Share', icon: Share2 },
  { name: 'Link', icon: Link },
  { name: 'ExternalLink', icon: ExternalLink },
  { name: 'Download', icon: Download },
  { name: 'Upload', icon: Upload },
  { name: 'Refresh', icon: RefreshCw },
  { name: 'Rotate', icon: RotateCcw },
  { name: 'History', icon: History },
  { name: 'Timer', icon: Timer },
  { name: 'Watch', icon: Watch },
  { name: 'Alarm', icon: AlarmClock },
  { name: 'Hourglass', icon: Hourglass },
  { name: 'CalendarDays', icon: CalendarDays },
  { name: 'Map', icon: Map },
  { name: 'Navigation', icon: Navigation },
  { name: 'Locate', icon: Locate },
  { name: 'Tent', icon: Tent },
  { name: 'Palmtree', icon: Palmtree },
  { name: 'Sailboat', icon: Sailboat },
  { name: 'Anchor', icon: Anchor },
  { name: 'LifeBuoy', icon: LifeBuoy },
  { name: 'Target', icon: Target },
  { name: 'Trophy', icon: Trophy },
  { name: 'Medal', icon: Medal },
  { name: 'Activity', icon: Activity },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'Stethoscope', icon: Stethoscope },
  { name: 'Thermometer', icon: Thermometer },
  { name: 'Pill', icon: Pill },
  { name: 'Syringe', icon: Syringe },
  { name: 'Microscope', icon: Microscope },
  { name: 'Dna', icon: Dna },
  { name: 'Flask', icon: FlaskConical },
  { name: 'TestTube', icon: TestTube2 },
  { name: 'Graduation', icon: GraduationCap },
  { name: 'Book', icon: Book },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Library', icon: Library },
  { name: 'School', icon: School },
  { name: 'University', icon: University },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Brain', icon: Brain },
  { name: 'Puzzle', icon: Puzzle },
  { name: 'Gamepad', icon: Gamepad2 },
  { name: 'Ghost', icon: Ghost },
  { name: 'Skull', icon: Skull },
  { name: 'Dices', icon: Dices },
  { name: 'Ticket', icon: Ticket },
  { name: 'Clapperboard', icon: Clapperboard },
  { name: 'Theater', icon: Theater },
  { name: 'Mic2', icon: Mic2 },
  { name: 'Music2', icon: Music2 },
  { name: 'Disc', icon: Disc },
  { name: 'Radio', icon: Radio },
  { name: 'Antenna', icon: Antenna },
  { name: 'Satellite', icon: Satellite },
  { name: 'Rocket', icon: Rocket },
  { name: 'Telescope', icon: Telescope },
  { name: 'Atom', icon: Atom },
  { name: 'Binary', icon: Binary },
  { name: 'Code', icon: Code },
  { name: 'Terminal', icon: Terminal },
  { name: 'Database', icon: Database },
  { name: 'Server', icon: Server },
  { name: 'CloudLightning', icon: CloudLightning },
  { name: 'CloudRain', icon: CloudRain },
  { name: 'CloudSnow', icon: CloudSnow },
  { name: 'Sunrise', icon: Sunrise },
  { name: 'Sunset', icon: Sunset },
  { name: 'Cloudy', icon: Cloudy },
  { name: 'Tornado', icon: Tornado },
  { name: 'Sprout', icon: Sprout },
  { name: 'Flower', icon: Flower },
  { name: 'Flower2', icon: Flower2 },
  { name: 'Citrus', icon: Citrus },
  { name: 'Apple', icon: Apple },
  { name: 'Beef', icon: Beef },
  { name: 'Cake', icon: Cake },
  { name: 'Candy', icon: Candy },
  { name: 'Cherry', icon: Cherry },
  { name: 'Cookie', icon: Cookie },
  { name: 'Croissant', icon: Croissant },
  { name: 'Egg', icon: Egg },
  { name: 'Fish', icon: Fish },
  { name: 'IceCream', icon: IceCream },
  { name: 'Pizza', icon: Pizza },
  { name: 'Popcorn', icon: Popcorn },
  { name: 'Soup', icon: Soup },
  { name: 'Wine', icon: Wine },
  { name: 'Beer', icon: Beer },
  { name: 'Baby', icon: Baby },
  { name: 'Footprints', icon: Footprints },
  { name: 'Hand', icon: Hand },
  { name: 'Fingerprint', icon: Fingerprint },
  { name: 'Scan', icon: Scan },
  { name: 'QrCode', icon: QrCode },
  { name: 'Barcode', icon: Barcode },
  { name: 'Nfc', icon: Nfc },
  { name: 'Rss', icon: Rss },
  { name: 'Send', icon: Send },
  { name: 'Paperclip', icon: Paperclip },
  { name: 'StickyNote', icon: StickyNote },
  { name: 'Clipboard', icon: Clipboard },
  { name: 'Archive', icon: Archive },
  { name: 'Folder', icon: Folder },
  { name: 'FolderOpen', icon: FolderOpen },
  { name: 'File', icon: File },
  { name: 'Files', icon: Files },
  { name: 'Image', icon: Image },
  { name: 'Images', icon: Images },
  { name: 'Play', icon: Play },
  { name: 'Pause', icon: Pause },
  { name: 'Square', icon: Square },
  { name: 'Circle', icon: Circle },
  { name: 'Triangle', icon: Triangle },
  { name: 'Hexagon', icon: Hexagon },
  { name: 'Octagon', icon: Octagon },
  { name: 'Sparkle', icon: Sparkle },
  { name: 'Check', icon: Check },
  { name: 'ChevronUp', icon: ChevronUp },
  { name: 'ChevronDown', icon: ChevronDown },
  { name: 'ArrowUp', icon: ArrowUp },
  { name: 'ArrowDown', icon: ArrowDown },
  { name: 'ArrowLeft', icon: ArrowLeft },
  { name: 'ArrowRight', icon: ArrowRight },
  { name: 'Move', icon: Move },
  { name: 'Maximize', icon: Maximize },
  { name: 'Minimize', icon: Minimize },
  { name: 'ZoomIn', icon: ZoomIn },
  { name: 'ZoomOut', icon: ZoomOut },
  { name: 'Plus', icon: PlusIcon },
  { name: 'Minus', icon: Minus },
  { name: 'Divide', icon: Divide },
  { name: 'Equal', icon: Equal },
  { name: 'Percent', icon: Percent },
  { name: 'Hash', icon: Hash },
  { name: 'AtSign', icon: AtSign },
  { name: 'Info', icon: InfoIcon },
  { name: 'Help', icon: HelpCircle },
  { name: 'Alert', icon: AlertCircle },
  { name: 'Warning', icon: AlertTriangle },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'XCircle', icon: XCircleIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('aqua-theme') || '#3b82f6';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', currentTheme);
    localStorage.setItem('aqua-theme', currentTheme);
  }, [currentTheme]);

  const themes = [
    { name: 'أزرق', color: '#3b82f6' },
    { name: 'ليلي', color: '#36395a' },
    { name: 'أحمر', color: '#EF4444' },
    { name: 'بنفسجي', color: '#8957e5' },
  ];
  const [stats, setStats] = useState({
    bookings: 0,
    cities: 0,
    hotels: 0,
    rooms: 0,
    articles: 0,
    coupons: 0
  });

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [customIcons, setCustomIcons] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customIcons');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const restored: Record<string, any> = {};
          Object.entries(parsed).forEach(([key, iconName]) => {
            const iconObj = availableIcons.find(i => i.name === iconName);
            if (iconObj) restored[key] = iconObj.icon;
          });
          return {
            dashboard: LayoutDashboard,
            cities: MapPin,
            hotels: Hotel,
            rooms: Bed,
            bookings: Calendar,
            ...restored
          };
        } catch (e) {
          console.error("Failed to parse customIcons", e);
        }
      }
    }
    return {
      dashboard: LayoutDashboard,
      cities: MapPin,
      hotels: Hotel,
      rooms: Bed,
      bookings: Calendar,
    };
  });

  const handleIconSelect = (itemId: string, icon: any) => {
    const iconObj = availableIcons.find(i => i.icon === icon);
    if (iconObj) {
      const saved = localStorage.getItem('customIcons') || '{}';
      const parsed = JSON.parse(saved);
      parsed[itemId] = iconObj.name;
      localStorage.setItem('customIcons', JSON.stringify(parsed));
    }
    setCustomIcons(prev => ({ ...prev, [itemId]: icon }));
    setIsIconPickerOpen(false);
    setIconPickerTarget(null);
  };

  useEffect(() => {
    // Test connection to Firestore with a slight delay to ensure initialization
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_connection_test', 'ping'));
        console.log("Firestore connection verified.");
      } catch (error) {
        // Only report if it's explicitly a connection/offline error
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.includes('the client is offline') || errMsg.includes('Backend didn\'t respond')) {
          console.warn("Firestore might be in offline mode:", errMsg);
          // Don't show toast immediately, as it might just be slow
        }
      }
    };
    
    const timer = setTimeout(testConnection, 2000);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setStats({ bookings: 0, cities: 0, hotels: 0, rooms: 0, articles: 0, coupons: 0 });
      return;
    }

    // Only run stats listeners for admins to avoid permission errors for regular users
    const userIsAdmin = ['otdragoze@gmail.com', 'shadyabdowd2020@gmail.com', 'gidehotel@gmail.com', 'abdo20004044@gmail.com'].includes(user.email || '');
    
    if (!userIsAdmin) return;

    const safeUnsub = (unsubFunc: () => void) => {
      try {
        unsubFunc();
      } catch (e) {
        // Ignore unsub errors
      }
    };

    // 3. Stats Fetching (One-time for collectionGroups to avoid SDK crashes)
    const loadStats = async () => {
      const fetchCount = async (collPath: string) => {
        try {
          const snap = await firestoreGetDocs(collection(db, collPath));
          return snap.size;
        } catch (err) {
          console.warn(`Stats: failed to fetch count for ${collPath}`, err);
          return 0;
        }
      };

      const fetchGroupCount = async (groupName: string) => {
        try {
          const snap = await firestoreGetDocs(query(collectionGroup(db, groupName)));
          return snap.size;
        } catch (err) {
          console.warn(`Stats: failed to fetch group count for ${groupName}`, err);
          return null;
        }
      };

      const [bookings, cities, articles, coupons] = await Promise.all([
        fetchCount('bookings'),
        fetchCount('cities'),
        fetchCount('Articles'),
        fetchCount('coupons')
      ]);

      setStats(prev => ({
        ...prev,
        bookings,
        cities,
        articles,
        coupons
      }));

      let hotelsCount = await fetchGroupCount('hotels');
      let roomsCount = await fetchGroupCount('rooms');

      if (hotelsCount === null || roomsCount === null) {
        try {
          const cSnap = await firestoreGetDocs(collection(db, 'cities'));
          let hCount = 0;
          let rCount = 0;
          for (const cDoc of cSnap.docs) {
            const hs = await firestoreGetDocs(collection(db, 'cities', cDoc.id, 'hotels'));
            hCount += hs.size;
            for (const hDoc of hs.docs) {
              const rs = await firestoreGetDocs(collection(db, 'cities', cDoc.id, 'hotels', hDoc.id, 'rooms'));
              rCount += rs.size;
            }
          }
          if (hotelsCount === null) hotelsCount = hCount;
          if (roomsCount === null) roomsCount = rCount;
        } catch (fallbackErr) {
          console.error('Stats: fallback failed', fallbackErr);
        }
      }

      setStats(prev => ({ 
        ...prev, 
        hotels: hotelsCount ?? prev.hotels, 
        rooms: roomsCount ?? prev.rooms 
      }));

      return () => {};
    };

    const cleanupPromise = loadStats();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [user]);

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: customIcons.dashboard },
    { id: 'cities', label: 'المدن والمرافئ', icon: customIcons.cities },
    { id: 'hotels', label: 'الفنادق', icon: customIcons.hotels || Hotel },
    { id: 'rooms', label: 'الغرف', icon: customIcons.rooms || Bed },
    { id: 'bookings', label: 'الحجوزات', icon: customIcons.bookings || Calendar },
    { id: 'articles', label: 'المقالات', icon: Newspaper },
    { id: 'coupons', label: 'الكوبونات', icon: Ticket },
    { id: 'maintenance', label: 'صيانة النظام', icon: customIcons.maintenance || Zap },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1.5">
              <img src="/logo.png" alt="AQUA Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-text-main tracking-tight">AQUA</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted mt-0.5">Management System</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav>
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.id} className="relative group/nav">
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setCityFilter(null); // Clear filter when switching manually
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "sidebar-item w-full group transition-all duration-300",
                    activeTab === item.id ? "sidebar-item-active" : ""
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    activeTab === item.id ? "text-primary" : "text-text-muted transition-colors group-hover:text-primary"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <div className="absolute left-3 w-1 h-4 rounded-full bg-primary" />
                  )}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIconPickerTarget(item.id);
                    setIsIconPickerOpen(true);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/nav:opacity-100 p-2 rounded-xl bg-muted/80 backdrop-blur-md text-text-muted hover:text-primary transition-all z-10 border border-border/50 scale-75 hover:scale-100"
                  title="تغيير الأيقونة"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-muted p-4 rounded-xl border border-border">
          <div className="text-[9px] uppercase font-bold text-text-muted mb-2 tracking-wider">الحالة</div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-success/80">
            <div className="h-2 w-2 rounded-full bg-success"></div>
            متصل بالنظام
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 h-11 px-4 text-text-muted hover:text-destructive hover:bg-destructive/5 font-bold transition-all rounded-lg group" 
          onClick={() => auth.signOut()}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">تسجيل الخروج</span>
        </Button>
      </div>
    </>
  );

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background font-sans" dir="rtl">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex w-80 bg-sidebar border-l border-border/40 flex flex-col z-20 shadow-[-10px_0_40px_rgba(0,0,0,0.03)]">
          <SidebarContent />
        </aside>

        {/* Sidebar (Mobile) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-sidebar z-30 flex flex-col shadow-2xl lg:hidden rounded-l-[3rem]"
            >
              <SidebarContent />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <header className="h-20 border-b border-border bg-card px-8 lg:px-10 flex items-center justify-between shrink-0 z-20 sticky top-0">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-10 w-10 rounded-lg bg-muted" 
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center bg-muted px-4 py-2 rounded-lg border border-border w-80 group focus-within:w-96 transition-all duration-300">
                <Search className="h-4 w-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="البحث..." 
                  className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full mx-3 placeholder:text-text-muted/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">


              <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />

              <div className="flex items-center gap-3 bg-muted p-1.5 pr-4 border border-border rounded-lg cursor-pointer hover:bg-muted/80 transition-all">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold text-text-main">{user?.displayName || 'المسؤول'}</span>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-wider">مدير النظام</span>
                </div>
                <div className="h-8 w-8 rounded-md overflow-hidden bg-white">
                  <img 
                    src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 lg:p-10 custom-scrollbar">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsContent value="dashboard" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-text-main tracking-tight">لوحة تحكم منصة AQUA</h2>
                    <p className="text-sm text-text-muted font-medium">نظرة عامة على أداء النظام وإدارة الوحدات السكنية.</p>
                  </div>
                  <div className="flex items-center gap-3 relative">
                    <div 
                      className={cn(
                        "h-11 w-11 bg-card border border-border rounded-lg flex items-center justify-center text-text-muted hover:text-primary transition-all cursor-pointer",
                        isThemePickerOpen && "text-primary border-primary/40 bg-primary/5 shadow-lg"
                      )}
                      onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                    >
                      <Settings className={cn("h-5 w-5", isThemePickerOpen && "animate-spin-slow")} />
                    </div>

                    <AnimatePresence>
                      {isThemePickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 top-14 z-50 w-56 bg-card border border-border shadow-2xl rounded-2xl p-4 overflow-hidden"
                        >
                          <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 px-2">اختر لون الهوية</div>
                          <div className="grid grid-cols-2 gap-2">
                            {themes.map((theme) => (
                              <button
                                key={theme.color}
                                onClick={() => {
                                  setCurrentTheme(theme.color);
                                  setIsThemePickerOpen(false);
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-xl transition-all border",
                                  currentTheme === theme.color 
                                    ? "bg-muted border-primary/20" 
                                    : "hover:bg-muted border-transparent"
                                )}
                              >
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.color }} />
                                <span className="text-[11px] font-bold">{theme.name}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div 
                    className="stat-card-v2 group bg-primary text-white border-none shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => setActiveTab('bookings')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-white/10">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <TrendingUp className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">الحجوزات</div>
                    <div className="text-3xl font-bold mt-1">{stats.bookings}</div>
                    <div className="mt-4 text-[10px] font-medium text-white/50">زيادة بنسبة 12% مؤخراً</div>
                  </div>

                  <div 
                    className="stat-card-v2 group cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
                    onClick={() => setActiveTab('cities')}
                  >
                    <div className="stat-icon-glow">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">المدن</div>
                    <div className="text-3xl font-bold text-text-main mt-1">{stats.cities}</div>
                  </div>

                  <div 
                    className="stat-card-v2 group cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
                    onClick={() => setActiveTab('hotels')}
                  >
                    <div className="stat-icon-glow">
                      <Hotel className="h-5 w-5" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">المنشآت</div>
                    <div className="text-3xl font-bold text-text-main mt-1">{stats.hotels}</div>
                  </div>

                  <div 
                    className="stat-card-v2 group cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
                    onClick={() => setActiveTab('rooms')}
                  >
                    <div className="stat-icon-glow">
                      <Bed className="h-5 w-5" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">الغرف</div>
                    <div className="text-3xl font-bold text-text-main mt-1">{stats.rooms}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div 
                    className="stat-card-v2 group cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
                    onClick={() => setActiveTab('articles')}
                  >
                    <div className="stat-icon-glow">
                      <Newspaper className="h-5 w-5" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">المقالات</div>
                    <div className="text-3xl font-bold text-text-main mt-1">{stats.articles}</div>
                  </div>

                  <div 
                    className="stat-card-v2 group cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
                    onClick={() => setActiveTab('coupons')}
                  >
                    <div className="stat-icon-glow">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">الكوبونات</div>
                    <div className="text-3xl font-bold text-text-main mt-1">{stats.coupons}</div>
                  </div>

                  <div className="stat-card-v2 bg-muted/30 border-dashed">
                    <div className="flex flex-col justify-center h-full text-center">
                       <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">النظام</div>
                       <div className="text-xl font-bold text-text-main">يعمل بكفاءة عالية</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  <div className="xl:col-span-3 space-y-10">
                    <div className="premium-card">
                      <div className="p-6 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                          <CalendarRange className="h-5 w-5 text-primary" />
                          أحدث العمليات
                        </h3>
                      </div>
                      <BookingManager isDashboard />
                    </div>
                    
                    <div className="space-y-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="space-y-2">
                          <h3 className="text-3xl font-black tracking-tight flex items-center gap-5">
                            <CompassIcon className="h-9 w-9 text-primary animate-pulse" />
                            الوجهات الاستراتيجية الموصى بها
                          </h3>
                          <p className="text-sm text-text-muted font-bold">توسع جغرافي مدروس لزيادة العوائد الاستثمارية.</p>
                        </div>
                        <Button variant="ghost" onClick={() => { setActiveTab('cities'); setCityFilter(null); }} className="font-black text-primary hover:bg-primary/5 rounded-2xl h-16 px-10 gap-4 group transition-all text-xs border border-transparent hover:border-primary/20">
                          إدارة المرافئ والمدن
                          <ChevronRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                        </Button>
                      </div>
                      <div className="premium-card p-2 border-none shadow-none bg-transparent">
                        <CityDashboardView onCityClick={(id) => {
                          setCityFilter(id);
                          setActiveTab('hotels');
                        }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="stat-card-v2 p-12 bg-primary text-white border-none relative overflow-hidden group shadow-[0_30px_70px_rgba(30,27,75,0.4)]">
                      <div className="absolute -right-24 -top-24 w-64 h-64 bg-white/10 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                      <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-accent/30 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
                      
                      <div className="relative z-10 space-y-12">
                        <div className="space-y-6">
                          <div className="w-18 h-18 rounded-[1.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <ZapIcon className="h-9 w-9 text-warning" />
                          </div>
                          <h3 className="font-black text-3xl tracking-tight leading-tight">التحكم المركزي الذكي</h3>
                          <p className="text-sm text-white/70 font-bold leading-loose">قم بإدارة أصولك العقارية بذكاء وإحترافية وبيانات آمنة 100%.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-5">
                          <Button variant="secondary" size="lg" onClick={() => setActiveTab('rooms')} className="w-full font-black h-18 text-xs uppercase tracking-[0.2em] rounded-2xl bg-white text-primary hover:bg-white/90 shadow-[0_20px_40px_rgba(0,0,0,0.2)] group/btn border-none">
                            إدارة الوحدات
                            <ChevronRightIcon className="h-5 w-5 mr-3 group-hover/btn:translate-x-2 transition-all" />
                          </Button>
                          <Button variant="outline" size="lg" onClick={() => setActiveTab('cities')} className="w-full font-black h-18 text-xs uppercase tracking-[0.2em] rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md">
                            تصفح الأصول
                          </Button>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hotels" className="m-0 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <HotelManager overrideCityId={cityFilter || undefined} />
                </motion.div>
              </TabsContent>

              <TabsContent value="cities" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CityManager />
                </motion.div>
              </TabsContent>

              <TabsContent value="bookings" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BookingManager />
                </motion.div>
              </TabsContent>

              <TabsContent value="articles" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArticleManager />
                </motion.div>
              </TabsContent>

              <TabsContent value="coupons" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CouponManager />
                </motion.div>
              </TabsContent>

              <TabsContent value="rooms" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlobalRoomView />
                </motion.div>
              </TabsContent>

              <TabsContent value="maintenance" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SystemMaintenance />
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        {/* Icon Picker Dialog */}
        <Dialog open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
          <DialogContent showCloseButton={false} className="w-[95vw] md:w-[600px] max-w-none max-h-[90vh] overflow-hidden bg-card/95 backdrop-blur-2xl border-none shadow-[0_0_100px_rgba(0,0,0,0.3)] p-0 rounded-[2.5rem]">
            <div className="bg-card/60 backdrop-blur-xl px-10 py-8 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="stat-icon-glow bg-primary/10 text-primary mb-0 scale-90">
                  <Palette className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <DialogTitle className="text-xl font-black tracking-tight text-text-main">تخصيص الهوية البصرية</DialogTitle>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">اختر أيقونة تعبر عن القسم</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsIconPickerOpen(false)} className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 max-h-[45vh] overflow-y-auto p-2 premium-scrollbar pr-4">
                {availableIcons.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => iconPickerTarget && handleIconSelect(iconPickerTarget, item.icon)}
                    className="flex flex-col items-center justify-center aspect-square rounded-2xl bg-muted/30 border border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all group relative"
                    title={item.name}
                  >
                    <item.icon className="h-6 w-6 group-hover:scale-125 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border/40 flex justify-end">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsIconPickerOpen(false)} 
                  className="h-12 px-10 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-muted transition-all"
                >
                  إلغاء التخصيص
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}



