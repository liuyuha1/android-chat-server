const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据库存储
let users = [];
let chatRooms = [
  {
    id: 'room1',
    name: 'yuhangLiu',
    description: 'General discussion for everyone',
    participants: [],
    unreadCount: 0,
    chatType: 'GROUP',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessage: null
  },
  {
    id: 'room2',
    name: '11111111111',
    description: 'Discuss technology and programming',
    participants: [],
    unreadCount: 0,
    chatType: 'GROUP',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessage: null
  },
  {
    id: 'room3',
    name: '3333333333',
    description: 'Random conversations',
    participants: [],
    unreadCount: 0,
    chatType: 'GROUP',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessage: null
  }
];

let messages = [
  {
    id: 'welcome1',
    content: '111111111111111111',
    senderId: 'system',
    senderName: 'System',
    timestamp: Date.now() - 3600000,
    chatRoomId: 'room1',
    messageType: 'SYSTEM'
  },
  {
    id: 'welcome2',
    content: '22222222222222222',
    senderId: 'system',
    senderName: 'System',
    timestamp: Date.now() - 1800000,
    chatRoomId: 'room2',
    messageType: 'SYSTEM'
  }
];

// 根路径 - API文档
app.get('/', (req, res) => {
  res.json({
    message: '🚂 Android Chat Server is running on Railway!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'online',
    endpoints: {
      health: 'GET /health',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      chatrooms: 'GET /api/chatrooms',
      messages: 'GET /api/chatrooms/:roomId/messages',
      sendMessage: 'POST /api/chatrooms/:roomId/messages',
      currentUser: 'GET /api/users/me'
    },
    features: [
      'User Authentication',
      'Real-time Chat',
      'Multiple Chat Rooms',
      'WebSocket Support',
      'CORS Enabled'
    ],
    docs: {
      login: {
        method: 'POST',
        url: '/api/auth/login',
        body: { username: 'string', password: 'string (min 6 chars)' }
      },
      sendMessage: {
        method: 'POST',
        url: '/api/chatrooms/{roomId}/messages',
        body: { content: 'string', messageType: 'TEXT' }
      }
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    platform: 'Railway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    users: users.length,
    chatRooms: chatRooms.length,
    totalMessages: messages.length
  });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // 输入验证
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码至少需要6位字符'
      });
    }

    // 创建或获取用户
    let user = users.find(u => u.username === username.trim());
    if (!user) {
      user = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        username: username.trim(),
        email: `${username.trim()}@example.com`,
        isOnline: true,
        lastSeen: Date.now(),
        avatarUrl: null
      };
      users.push(user);
      console.log(`✅ New user registered: ${user.username} (ID: ${user.id})`);
    } else {
      user.isOnline = true;
      user.lastSeen = Date.now();
      console.log(`✅ User logged in: ${user.username} (ID: ${user.id})`);
    }

    const token = 'railway_token_' + user.id + '_' + Date.now();

    res.json({
      success: true,
      data: {
        user: user,
        token: token
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 用户注册
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 输入验证
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '所有字段都是必填的'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码至少需要6位字符'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(400).json({
        success: false,
        error: '用户名已存在'
      });
    }

    const user = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      username: username.trim(),
      email: email.trim(),
      isOnline: true,
      lastSeen: Date.now(),
      avatarUrl: null
    };

    users.push(user);
    console.log(`✅ User registered: ${user.username} (ID: ${user.id})`);

    res.json({
      success: true,
      data: user,
      message: '注册成功'
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 删除用户账号
app.delete('/api/auth/user', (req, res) => {
  try {
    const { username, password } = req.body;

    // 输入验证
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码至少需要6位字符'
      });
    }

    const trimmedUsername = username.trim();

    // 检查用户是否存在
    const existingUser = users.find(u => u.username === trimmedUsername);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 验证密码（简单匹配，实际应用中应该使用哈希验证）
    if (existingUser.password !== password) {
      return res.status(401).json({
        success: false,
        error: '密码错误'
      });
    }

    // 删除用户相关数据
    const userIndex = users.findIndex(u => u.username === trimmedUsername);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }

    // 删除用户的消息
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderName === trimmedUsername) {
        messages.splice(i, 1);
      }
    }

    // 更新聊天室中的参与者列表
    chatRooms.forEach(room => {
      if (room.participants) {
        const participantIndex = room.participants.indexOf(trimmedUsername);
        if (participantIndex !== -1) {
          room.participants.splice(participantIndex, 1);
        }
      }
    });

    console.log(`✅ User deleted successfully: ${trimmedUsername}`);
    
    res.json({
      success: true,
      message: '用户删除成功',
      data: {
        username: trimmedUsername,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取聊天室列表
app.get('/api/chatrooms', (req, res) => {
  try {
    // 为每个聊天室添加最新消息
    const roomsWithLastMessage = chatRooms.map(room => {
      const roomMessages = messages
        .filter(m => m.chatRoomId === room.id)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      const lastMessage = roomMessages[0] || null;
      
      return {
        ...room,
        lastMessage: lastMessage,
        unreadCount: roomMessages.length > 0 ? Math.floor(Math.random() * 3) : 0 // 模拟未读数
      };
    });

    console.log(`📋 Fetched ${roomsWithLastMessage.length} chat rooms`);

    res.json({
      success: true,
      data: roomsWithLastMessage
    });

  } catch (error) {
    console.error('❌ Get chatrooms error:', error);
    res.status(500).json({
      success: false,
      error: '获取聊天室失败'
    });
  }
});

// 获取聊天室消息
app.get('/api/chatrooms/:roomId/messages', (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page || '0');
    const size = parseInt(req.query.size || '50');

    // 验证聊天室是否存在
    const room = chatRooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: '聊天室不存在'
      });
    }

    // 获取消息并分页
    const roomMessages = messages
      .filter(m => m.chatRoomId === roomId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(page * size, (page + 1) * size);

    console.log(`💬 Fetched ${roomMessages.length} messages for room ${roomId}`);

    res.json({
      success: true,
      data: roomMessages,
      pagination: {
        page: page,
        size: size,
        total: messages.filter(m => m.chatRoomId === roomId).length
      }
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      error: '获取消息失败'
    });
  }
});

// 发送消息
app.post('/api/chatrooms/:roomId/messages', (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = 'TEXT' } = req.body;

    // 验证输入
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 验证聊天室是否存在
    const room = chatRooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: '聊天室不存在'
      });
    }

    // 创建消息
    const message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      content: content.trim(),
      senderId: 'current_user_' + Date.now(),
      senderName: 'User' + Math.floor(Math.random() * 100),
      timestamp: Date.now(),
      chatRoomId: roomId,
      messageType: messageType,
      isFromCurrentUser: false
    };

    messages.push(message);

    // 更新聊天室的最后消息时间
    room.updatedAt = Date.now();
    room.lastMessage = message;

    console.log(`📤 New message sent to room ${roomId}: "${content.substring(0, 50)}..."`);

    // 通过WebSocket广播消息
    io.to(roomId).emit('new-message', message);
    io.emit('room-updated', room);

    res.json({
      success: true,
      data: message,
      message: '消息发送成功'
    });

  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      error: '发送消息失败'
    });
  }
});

// 获取当前用户信息
app.get('/api/users/me', (req, res) => {
  try {
    // 模拟获取当前用户
    const mockUser = {
      id: 'current_user',
      username: 'CurrentUser',
      email: 'current@example.com',
      isOnline: true,
      lastSeen: Date.now()
    };

    res.json({
      success: true,
      data: mockUser
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

// WebSocket连接处理
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // 加入聊天室
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`🏠 Socket ${socket.id} joined room: ${roomId}`);
    socket.to(roomId).emit('user-joined', { socketId: socket.id, roomId });
  });

  // 离开聊天室
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 Socket ${socket.id} left room: ${roomId}`);
    socket.to(roomId).emit('user-left', { socketId: socket.id, roomId });
  });

  // 发送消息（WebSocket方式）
  socket.on('send-message', (messageData) => {
    const { roomId, content, senderId, senderName } = messageData;
    
    const message = {
      id: 'ws_msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      content: content,
      senderId: senderId || socket.id,
      senderName: senderName || 'Anonymous',
      timestamp: Date.now(),
      chatRoomId: roomId,
      messageType: 'TEXT',
      isFromCurrentUser: false
    };

    messages.push(message);
    
    // 广播给房间内所有用户
    io.to(roomId).emit('new-message', message);
    
    console.log(`📡 WebSocket message sent to room ${roomId}: "${content}"`);
  });

  // 用户正在输入
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      roomId: data.roomId
    });
  });

  // 用户停止输入
  socket.on('stop-typing', (data) => {
    socket.to(data.roomId).emit('user-stop-typing', {
      userId: data.userId,
      roomId: data.roomId
    });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/chatrooms',
      'GET /api/chatrooms/:roomId/messages',
      'POST /api/chatrooms/:roomId/messages'
    ]
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚂 ========================================
   Railway Chat Server Started!
🚂 ========================================
🌐 Server running on port: ${PORT}
📱 Health check: http://localhost:${PORT}/health
💬 API base: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
⏰ Started at: ${new Date().toISOString()}
🚂 ========================================
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
