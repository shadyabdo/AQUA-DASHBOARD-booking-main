import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// تطبيق RTL على نافذة SweetAlert2 عبر DOM مباشرةً
const applyRTL = (popup: HTMLElement) => {
  popup.style.direction = 'rtl';
  const title = popup.querySelector<HTMLElement>('.swal2-title');
  const content = popup.querySelector<HTMLElement>('.swal2-html-container');
  const text = popup.querySelector<HTMLElement>('.swal2-content');
  const actions = popup.querySelector<HTMLElement>('.swal2-actions');
  const icon = popup.querySelector<HTMLElement>('.swal2-icon');
  
  if (title) { title.style.textAlign = 'center'; title.style.direction = 'rtl'; }
  if (content) { content.style.textAlign = 'center'; content.style.direction = 'rtl'; }
  if (text) { text.style.textAlign = 'center'; text.style.direction = 'rtl'; }
  if (actions) { actions.style.direction = 'rtl'; }
  // Fix icon spacing for RTL
  if (icon) { icon.style.marginRight = 'auto'; icon.style.marginLeft = 'auto'; }
};

const BaseSwal = withReactContent(Swal);

const MySwal = BaseSwal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  background: 'var(--card)',
  color: 'var(--text-main)',
  customClass: {
    popup: 'rounded-2xl border border-border shadow-glass font-sans',
    title: 'text-2xl font-bold text-text-main',
    htmlContainer: 'text-base font-medium text-text-muted mt-2',
    actions: 'mt-8 flex justify-center w-full gap-3',
    confirmButton: 'bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]',
    cancelButton: 'bg-destructive/10 text-destructive hover:bg-destructive/20 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.98]',
    denyButton: 'bg-warning/10 text-warning hover:bg-warning/20 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 active:scale-[0.98]',
  },
  didOpen: (popup) => applyRTL(popup),
});

export const toast = {
  success: (title: string) => {
    MySwal.fire({
      icon: 'success',
      title,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl border border-border shadow-premium',
        title: 'text-sm font-bold font-sans text-text-main',
      },
    });
  },
  error: (title: string) => {
    MySwal.fire({
      icon: 'error',
      title,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl border border-border shadow-premium',
        title: 'text-sm font-bold font-sans text-text-main',
      },
    });
  },
  info: (title: string) => {
    MySwal.fire({
      icon: 'info',
      title,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl border border-border shadow-premium',
        title: 'text-sm font-bold font-sans text-text-main',
      },
    });
  },
};

export const confirm = async (title: string, text?: string) => {
  const result = await MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، قم بالتنفيذ',
    cancelButtonText: 'إلغاء',
    padding: '2rem',
  });
  return result.isConfirmed;
};

export default MySwal;
