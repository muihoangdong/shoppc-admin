/** Âm báo ngắn khi có đơn/tin nhắn mới. Tạo bằng WebAudio nên không cần file âm thanh. Mặc định BẬT, có thể tắt (lưu theo trình duyệt). */
const KEY = 'admin_sound';

export const isSoundEnabled = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setSoundEnabled = (on: boolean): void => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* bỏ qua */
  }
};

let ctx: AudioContext | null = null;

/** Phát tiếng "ding" nhẹ. Trình duyệt chặn âm thanh trước lần tương tác đầu tiên — lỗi đó được bỏ qua êm. */
export const playBeep = (): void => {
  if (!isSoundEnabled()) return;
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    ctx = ctx || new Ctor();
    if (ctx!.state === 'suspended') void ctx!.resume();
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx!.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx!.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx!.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx!.destination);
    osc.start();
    osc.stop(ctx!.currentTime + 0.4);
  } catch {
    /* bỏ qua */
  }
};
