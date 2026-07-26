# دليل تشغيل Laravel Reverb - Slack Clone

## ✅ ما تم إنجازه

### Backend (Laravel)
1. ✅ تثبيت Laravel Reverb v1.6.1
2. ✅ إنشاء ملف `config/reverb.php`
3. ✅ إنشاء ملف `config/broadcasting.php`
4. ✅ إنشاء ملف `routes/channels.php` مع Authorization كامل
5. ✅ تحديث `.env.example` بإعدادات Reverb
6. ✅ إنشاء Events:
   - `MessageSent` - للرسائل الجديدة
   - `MessageUpdated` - لتحديث الرسائل
   - `MessageDeleted` - لحذف الرسائل
   - `ReactionToggled` - للتفاعلات
   - `UserMentioned` - للإشعارات
   - `DirectMessageSent` - للرسائل المباشرة
7. ✅ تحديث Controllers:
   - `MessageController` - إضافة broadcasting للرسائل
   - `ReactionController` - إضافة broadcasting للتفاعلات
   - `DirectMessageController` - إضافة broadcasting للرسائل المباشرة

---

## 🚀 خطوات التشغيل

### 1️⃣ تحديث ملف `.env`

انسخ الإعدادات من `.env.example` إلى `.env`:

```bash
cd /mnt/hp/software_link/slack_final/backend
```

أضف هذه الأسطر إلى ملف `.env`:

```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=slack-app
REVERB_APP_KEY=slack-key
REVERB_APP_SECRET=slack-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### 2️⃣ تشغيل Reverb Server

في terminal جديد:

```bash
cd /mnt/hp/software_link/slack_final/backend
php artisan reverb:start
```

يجب أن ترى:

```
Reverb server started on 0.0.0.0:8080
```

### 3️⃣ تشغيل Queue Worker (مهم!)

في terminal آخر (لأن Events تحتاج Queue):

```bash
cd /mnt/hp/software_link/slack_final/backend
php artisan queue:work
```

### 4️⃣ تشغيل Laravel Server

في terminal ثالث:

```bash
cd /mnt/hp/software_link/slack_final/backend
php artisan serve
```

---

## 📡 القنوات المتاحة (Channels)

تم إنشاء القنوات التالية في `routes/channels.php`:

### 1. `private-user.{userId}`
- **الاستخدام**: إشعارات شخصية، منشنز، رسائل مفضلة
- **Authorization**: المستخدم نفسه فقط
- **Events**: `UserMentioned`

### 2. `private-channel.{channelId}`
- **الاستخدام**: رسائل القناة، تفاعلات، أعضاء
- **Authorization**: أعضاء القناة فقط من نفس الشركة
- **Events**: `MessageSent`, `MessageUpdated`, `MessageDeleted`, `ReactionToggled`

### 3. `private-company.{companyId}`
- **الاستخدام**: أحداث الشركة، قنوات جديدة
- **Authorization**: موظفي الشركة فقط
- **Events**: (للاستخدام المستقبلي)

### 4. `private-conversation.{userId1}.{userId2}`
- **الاستخدام**: رسائل مباشرة بين مستخدمين
- **Authorization**: المشاركين فقط
- **Events**: `DirectMessageSent`

### 5. `private-thread.{messageId}`
- **الاستخدام**: ردود المحادثات المتسلسلة
- **Authorization**: أعضاء القناة التي تحتوي الرسالة
- **Events**: (للاستخدام المستقبلي)

### 6. `presence-company.{companyId}`
- **الاستخدام**: تتبع المستخدمين المتصلين
- **Authorization**: موظفي الشركة
- **Events**: Presence events (automatic)

---

## 🧪 اختبار Broadcasting

### اختبار من Terminal

```bash
# في Laravel Tinker
php artisan tinker

# إرسال رسالة تجريبية
$message = App\Models\Message::first();
broadcast(new App\Events\MessageSent($message));
```

### اختبار من Postman

1. **إرسال رسالة جديدة**:
   ```
   POST http://localhost:8000/api/messages
   Headers:
     Authorization: Bearer {token}
   Body:
     {
       "channel_id": 1,
       "content": "Test message"
     }
   ```

2. **تفعيل تفاعل**:
   ```
   POST http://localhost:8000/api/reactions/toggle
   Headers:
     Authorization: Bearer {token}
   Body:
     {
       "message_id": 1,
       "icon": "👍"
     }
   ```

### مراقبة Events

في terminal Reverb، يجب أن ترى:

```
[2025-11-18 19:55:00] Broadcasting to channel.1: message.sent
[2025-11-18 19:55:05] Broadcasting to channel.1: reaction.toggled
```

---

## 📱 Frontend (Flutter) - الخطوات القادمة

### 1. إضافة Dependencies

في `pubspec.yaml`:

```yaml
dependencies:
  pusher_channels_flutter: ^2.2.1
```

ثم:

```bash
cd /mnt/hp/software_link/slack_final/android
flutter pub get
```

### 2. إعداد Pusher Client

إنشاء ملف `lib/core/services/websocket_service.dart`:

```dart
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  late PusherChannelsFlutter pusher;
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    pusher = PusherChannelsFlutter.getInstance();
    
    await pusher.init(
      apiKey: 'slack-key',
      cluster: 'mt1',
      onConnectionStateChange: onConnectionStateChange,
      onError: onError,
      onSubscriptionSucceeded: onSubscriptionSucceeded,
      onEvent: onEvent,
      onSubscriptionError: onSubscriptionError,
      onDecryptionFailure: onDecryptionFailure,
      onMemberAdded: onMemberAdded,
      onMemberRemoved: onMemberRemoved,
      // For local development
      host: 'localhost',
      wsPort: 8080,
      wssPort: 8080,
      encrypted: false,
      activityTimeout: 120000,
      pongTimeout: 30000,
    );

    await pusher.connect();
    _isInitialized = true;
  }

  void onConnectionStateChange(dynamic currentState, dynamic previousState) {
    print('Connection: $currentState');
  }

  void onError(String message, int? code, dynamic e) {
    print('Error: $message code: $code exception: $e');
  }

  void onEvent(PusherEvent event) {
    print('Event: ${event.eventName} data: ${event.data}');
  }

  void onSubscriptionSucceeded(String channelName, dynamic data) {
    print('Subscribed to: $channelName');
  }

  void onSubscriptionError(String message, dynamic e) {
    print('Subscription error: $message Exception: $e');
  }

  void onDecryptionFailure(String event, String reason) {
    print('Decryption failure: $event reason: $reason');
  }

  void onMemberAdded(String channelName, PusherMember member) {
    print('Member added: ${member.userInfo}');
  }

  void onMemberRemoved(String channelName, PusherMember member) {
    print('Member removed: ${member.userInfo}');
  }

  Future<void> subscribeToChannel(String channelName) async {
    await pusher.subscribe(channelName: channelName);
  }

  Future<void> unsubscribeFromChannel(String channelName) async {
    await pusher.unsubscribe(channelName: channelName);
  }

  void disconnect() {
    pusher.disconnect();
    _isInitialized = false;
  }
}
```

### 3. تحديث Chat Screen

في `chat_screen.dart`:

```dart
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import '../../../core/services/websocket_service.dart';

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final WebSocketService _wsService = WebSocketService();
  PusherChannel? _channel;

  @override
  void initState() {
    super.initState();
    _initializeWebSocket();
  }

  Future<void> _initializeWebSocket() async {
    await _wsService.initialize();
    
    // Subscribe to channel
    final channelName = 'private-channel.${widget.channel.id}';
    _channel = await _wsService.pusher.subscribe(
      channelName: channelName,
      onEvent: _handleChannelEvent,
    );
  }

  void _handleChannelEvent(PusherEvent event) {
    print('Channel event: ${event.eventName}');
    
    switch (event.eventName) {
      case 'message.sent':
        _handleNewMessage(event.data);
        break;
      case 'message.updated':
        _handleMessageUpdated(event.data);
        break;
      case 'message.deleted':
        _handleMessageDeleted(event.data);
        break;
      case 'reaction.toggled':
        _handleReactionToggled(event.data);
        break;
    }
  }

  void _handleNewMessage(String data) {
    final json = jsonDecode(data);
    final message = MessageModel.fromJson(json['message']);
    ref.read(chatProvider(widget.channel.id).notifier).addMessage(message);
  }

  void _handleMessageUpdated(String data) {
    final json = jsonDecode(data);
    final message = MessageModel.fromJson(json['message']);
    ref.read(chatProvider(widget.channel.id).notifier).updateMessage(message);
  }

  void _handleMessageDeleted(String data) {
    final json = jsonDecode(data);
    final messageId = json['message_id'];
    ref.read(chatProvider(widget.channel.id).notifier).removeMessage(messageId);
  }

  void _handleReactionToggled(String data) {
    final json = jsonDecode(data);
    // Refresh the specific message
    ref.read(chatProvider(widget.channel.id).notifier).refreshMessages();
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    super.dispose();
  }
}
```

---

## 🔍 Debugging

### تحقق من Reverb Server

```bash
# يجب أن يكون يعمل على المنفذ 8080
curl http://localhost:8080/app/slack-key
```

### تحقق من Broadcasting Config

```bash
php artisan config:clear
php artisan config:cache
```

### مراقبة Logs

```bash
# في terminal منفصل
tail -f storage/logs/laravel.log
```

---

## ⚠️ ملاحظات مهمة

1. **Queue Worker**: يجب تشغيل `php artisan queue:work` لأن Events تستخدم Queue
2. **Authorization**: كل القنوات محمية بـ Authorization في `routes/channels.php`
3. **Multi-tenancy**: جميع القنوات تتحقق من `company_id` للعزل
4. **toOthers()**: نستخدم `->toOthers()` لتجنب إرسال Event للمستخدم الذي أطلقه
5. **Production**: في الإنتاج، استخدم:
   - `REVERB_SCHEME=https`
   - `REVERB_PORT=443`
   - Domain name بدلاً من localhost

---

## 🎯 الخطوات القادمة

### أولوية عالية ✅
- [x] تثبيت Reverb
- [x] إنشاء Events للرسائل
- [x] إنشاء Events للتفاعلات
- [x] إنشاء Events للرسائل المباشرة
- [ ] تنفيذ Frontend (Flutter)
- [ ] اختبار شامل

### أولوية متوسطة
- [ ] إضافة Events للقنوات (ChannelCreated, MemberAdded)
- [ ] إضافة Presence Channel للمستخدمين المتصلين
- [ ] إضافة Events للمحادثات المتسلسلة

### أولوية منخفضة
- [ ] إضافة Events للتذاكر
- [ ] إضافة Events للمفضلة
- [ ] تحسين الأداء والتخزين المؤقت

---

## 📚 مصادر إضافية

- [Laravel Reverb Docs](https://laravel.com/docs/reverb)
- [Laravel Broadcasting Docs](https://laravel.com/docs/broadcasting)
- [Pusher Channels Flutter](https://pub.dev/packages/pusher_channels_flutter)

---

## 🆘 حل المشاكل الشائعة

### المشكلة: Reverb لا يبدأ
```bash
# تأكد من عدم استخدام المنفذ 8080
lsof -i :8080
# إذا كان مستخدم، أوقفه أو غير المنفذ في .env
```

### المشكلة: Events لا تُرسل
```bash
# تأكد من تشغيل Queue Worker
php artisan queue:work

# تحقق من BROADCAST_CONNECTION
php artisan config:clear
```

### المشكلة: Authorization فشل
```bash
# تأكد من إرسال token في headers
# تحقق من routes/channels.php
```

---

تم إنشاء هذا الدليل بتاريخ: 2025-11-18
