// Öğe ekrana yaklaşınca bir kez true olur (kaydırmayla görünür olana dek ağır çizimi ertelemek için).
import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useSeen(elRef, { margin = '200px' } = {}) {
  const seen = ref(typeof IntersectionObserver === 'undefined');
  let io;
  onMounted(() => {
    if (seen.value || !elRef.value) return;
    io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        seen.value = true;
        io.disconnect();
      }
    }, { rootMargin: margin });
    io.observe(elRef.value);
  });
  onBeforeUnmount(() => io?.disconnect());
  return seen;
}
