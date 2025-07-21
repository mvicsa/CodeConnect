import { Notification } from '@/types/notification';

type NotificationCallback = (notification: Notification) => void;

class SocketService {
  private socket: any = null;
  private userId: string | null = null;
  private notificationCallbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private userInteracted = false; // تتبع تفاعل المستخدم
  private lastNotificationId: string | null = null; // تتبع آخر إشعار
  private lastNotificationTime: number = 0; // تتبع وقت آخر إشعار
  private notificationAudio: HTMLAudioElement | null = null; // تحميل الصوت مسبقاً

  async connect(userId: string, token?: string) {
    this.userId = userId;
    
    // إعداد تفاعل المستخدم
    this.setupUserInteraction();
    
    // تحميل الصوت مسبقاً
    this.preloadNotificationSound();
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    console.log('🔌 Attempting to connect to:', socketUrl);
    console.log('👤 User ID:', userId);
    console.log('🔑 Token exists:', !!token);
    
    // فحص أن الباك إند يعمل
    try {
      const healthUrl = socketUrl.replace('ws', 'http').replace('wss', 'https');
      console.log('🏥 Checking backend health at:', healthUrl);
      
      const response = await fetch(`${healthUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('🏥 Backend health check:', response.ok, response.status);
    } catch (error) {
      console.warn('⚠️ Backend might not be running on port 5000');
      console.warn('💡 Make sure your backend is running on http://localhost:5000');
      console.warn('🔧 Try: npm start or node server.js in your backend folder');
    }
    
    try {
      const socketIO = await import('socket.io-client');
      const io = socketIO.default;
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        auth: token ? { token } : undefined,
        query: { userId },
        timeout: 20000, // زيادة timeout
        forceNew: true, // إجبار اتصال جديد
      });

      this.setupEventListeners();
      this.setupReconnection();
    } catch (error) {
      console.error('Failed to load socket.io-client:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // الانضمام لغرفة المستخدم
    this.socket.on('connect', () => {
      console.log('✅ Connected to notifications socket!', this.socket?.id);
      this.reconnectAttempts = 0;
      
      if (this.userId) {
        console.log('🎯 Joining room for user:', this.userId);
        this.socket?.emit('join', this.userId);
      }
    });

    // فحص حالة الاتصال
    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Connection error:', error);
      console.log('🔍 Error details:', {
        message: error.message,
        description: error.description,
        context: error.context
      });
    });

    // الاستماع للإشعارات الجديدة
    this.socket.on('notification', (notification: Notification) => {
      console.log('📨 New notification received:', notification);
      this.handleNewNotification(notification);
    });

    // معالجة الأخطاء
    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      this.handleSocketError(error);
    });

    // معالجة قطع الاتصال
    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected from notifications socket:', reason);
      this.handleDisconnect(reason);
    });

    // إعادة الاتصال
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      
      if (this.userId) {
        this.socket?.emit('join', this.userId);
      }
    });

    // فشل إعادة الاتصال
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after maximum attempts');
      this.handleReconnectFailed();
    });
  }

  private setupReconnection() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect') {
        // تم قطع الاتصال من الخادم
        console.log('Server disconnected, attempting to reconnect...');
        this.socket?.connect();
      } else if (reason === 'io client disconnect') {
        // تم قطع الاتصال من العميل
        console.log('Client disconnected');
      } else {
        // قطع اتصال غير متوقع
        console.log('Unexpected disconnect, attempting to reconnect...');
        this.attemptReconnect();
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private handleNewNotification(notification: Notification) {
    const now = Date.now();
    
    // فحص إذا كان التاريخ صحيح
    if (!notification.createdAt) {
      console.warn('⚠️ Notification missing createdAt:', notification._id);
      notification.createdAt = new Date().toISOString();
    } else {
      // فحص إذا كان التاريخ صحيح
      const notificationTime = new Date(notification.createdAt).getTime();
      if (isNaN(notificationTime)) {
        console.warn('⚠️ Invalid createdAt date:', notification.createdAt, 'for notification:', notification._id);
        notification.createdAt = new Date().toISOString();
      }
    }
    
    // فحص إذا كان الإشعار قديم (أكثر من دقيقة)
    const notificationTime = new Date(notification.createdAt).getTime();
    if (now - notificationTime > 60000) {
      console.log('🚫 Skipping old notification from socket:', notification._id);
      return;
    }
    
    // فحص إذا كان نفس الإشعار تم استقباله مؤخراً
    if (this.lastNotificationId === notification._id && 
        (now - this.lastNotificationTime) < 2000) {
      console.log('🚫 Skipping duplicate notification from socket:', notification._id);
      return;
    }
    
    // تحديث تتبع الإشعارات
    this.lastNotificationId = notification._id;
    this.lastNotificationTime = now;
    
    console.log('📨 Processing new notification:', notification._id);
    
    // إرسال الإشعار إلى جميع المستمعين
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });

    // إظهار toast notification
    this.showToastNotification(notification);
    
    // تشغيل صوت الإشعار (فقط إذا كان مفعل)
    const soundEnabled = typeof window !== 'undefined' && localStorage.getItem('notificationSound') !== 'disabled';
    if (soundEnabled) {
      this.playNotificationSound();
    }
    
    // اهتزاز الجهاز (فقط إذا كان مفعل)
    const vibrationEnabled = typeof window !== 'undefined' && localStorage.getItem('notificationVibration') !== 'disabled';
    if (vibrationEnabled) {
      this.vibrateDevice();
    }
  }

  private showToastNotification(notification: Notification) {
    // تم إزالة toast notifications
    console.log('🔔 Notification received (toast disabled):', notification._id);
  }



  private setupUserInteraction() {
    // تتبع تفاعل المستخدم مع الصفحة
    const markUserInteracted = () => {
      this.userInteracted = true;
      // إزالة event listeners بعد التفاعل الأول
      document.removeEventListener('click', markUserInteracted);
      document.removeEventListener('keydown', markUserInteracted);
      document.removeEventListener('touchstart', markUserInteracted);
    };

    // إضافة event listeners
    document.addEventListener('click', markUserInteracted, { once: true });
    document.addEventListener('keydown', markUserInteracted, { once: true });
    document.addEventListener('touchstart', markUserInteracted, { once: true });
  }

  private playNotificationSound() {
    try {
      // تشغيل الصوت فقط إذا تفاعل المستخدم مع الصفحة
      if (this.userInteracted && document.visibilityState === 'visible' && document.hasFocus()) {
        // استخدام ملف الصوت الحقيقي
        this.playNotificationAudioFile();
      }
    } catch (error) {
      // تجاهل أخطاء الصوت
      if (error instanceof Error && error.name !== 'NotAllowedError') {
        console.warn('Audio error:', error);
      }
    }
  }

  private preloadNotificationSound() {
    try {
      // تحميل الصوت مسبقاً
      this.notificationAudio = new Audio('/sounds/notification.wav');
      this.notificationAudio.volume = 0.5;
      this.notificationAudio.preload = 'auto';
      console.log('🔊 Preloaded notification sound');
    } catch (error) {
      console.warn('Failed to preload notification sound:', error);
    }
  }

  private playNotificationAudioFile() {
    try {
      if (this.notificationAudio) {
        // إعادة تعيين الصوت للبداية
        this.notificationAudio.currentTime = 0;
        
        // تشغيل الصوت
        this.notificationAudio.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
        
        console.log('🔊 Playing notification sound');
      } else {
        // fallback إذا لم يتم التحميل المسبق
        const audio = new Audio('/sounds/notification.wav');
        audio.volume = 0.5;
        audio.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private vibrateDevice() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(200);
      } catch (error) {
        console.error('Error vibrating device:', error);
      }
    }
  }

  private handleSocketError(error: any) {
    console.error('Socket error occurred:', error);
    
    // إرسال event للـ window لإظهار رسالة خطأ
    const event = new CustomEvent('socketError', {
      detail: error
    });
    window.dispatchEvent(event);
  }

  private handleDisconnect(reason: string) {
    console.log('Socket disconnected:', reason);
    
    // إرسال event للـ window
    const event = new CustomEvent('socketDisconnect', {
      detail: { reason }
    });
    window.dispatchEvent(event);
  }

  private handleReconnectFailed() {
    console.error('Failed to reconnect to socket');
    
    // إرسال event للـ window
    const event = new CustomEvent('socketReconnectFailed');
    window.dispatchEvent(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.notificationCallbacks = [];
      this.reconnectAttempts = 0;
    }
  }

  // إضافة مستمع للإشعارات
  onNotification(callback: NotificationCallback) {
    this.notificationCallbacks.push(callback);
    
    // إرجاع دالة لإزالة المستمع
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  // إزالة مستمع للإشعارات
  offNotification(callback: NotificationCallback) {
    const index = this.notificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1);
    }
  }

  // إرسال إشعار (للتطوير والاختبار)
  emitNotification(notification: Partial<Notification>) {
    if (this.socket) {
      this.socket.emit('notification', notification);
    }
  }

  // الحصول على حالة الاتصال
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // الحصول على معرف الاتصال
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  // الحصول على معرف المستخدم
  getUserId(): string | null {
    return this.userId;
  }

  // إرسال رسالة مخصصة للخادم
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // الاستماع لحدث مخصص من الخادم
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // إزالة مستمع لحدث مخصص
  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // تفعيل/إيقاف صوت الإشعارات
  setSoundEnabled(enabled: boolean) {
    if (typeof window !== 'undefined') {
      if (enabled) {
        localStorage.removeItem('notificationSound');
      } else {
        localStorage.setItem('notificationSound', 'disabled');
      }
    }
  }

  // تفعيل/إيقاف اهتزاز الإشعارات
  setVibrationEnabled(enabled: boolean) {
    if (typeof window !== 'undefined') {
      if (enabled) {
        localStorage.removeItem('notificationVibration');
      } else {
        localStorage.setItem('notificationVibration', 'disabled');
      }
    }
  }

  // فحص إذا كان الصوت مفعل
  isSoundEnabled(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationSound') !== 'disabled';
    }
    return true; // افتراضي: مفعل
  }

  // فحص إذا كان الاهتزاز مفعل
  isVibrationEnabled(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationVibration') !== 'disabled';
    }
    return true; // افتراضي: مفعل
  }


}

// إنشاء instance واحد من الخدمة
export const socketService = new SocketService();

// Export للاستخدام المباشر
export default socketService; 