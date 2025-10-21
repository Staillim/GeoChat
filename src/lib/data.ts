export type User = {
  id: string;
  name: string;
  avatar: string;
  lat: number;
  lng: number;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  participant: User;
  messages: Message[];
  unreadCount: number;
};

const users: User[] = [
  { id: 'user-1', name: 'Sara', avatar: 'user-1', lat: 34.0522, lng: -118.2437 },
  { id: 'user-2', name: 'Álex', avatar: 'user-2', lat: 34.055, lng: -118.245 },
  { id: 'user-3', name: 'María', avatar: 'user-3', lat: 34.049, lng: -118.240 },
  { id: 'user-4', name: 'David', avatar: 'user-4', lat: 34.058, lng: -118.25 },
  { id: 'user-5', name: 'Sofía', avatar: 'user-5', lat: 34.051, lng: -118.238 },
  { id: 'user-6', name: 'Juan', avatar: 'user-6', lat: 40.7128, lng: -74.0060 },
  { id: 'user-7', name: 'Ana', avatar: 'user-7', lat: 40.715, lng: -74.002 },
  { id: 'user-8', name: 'Miguel', avatar: 'user-8', lat: 40.710, lng: -74.009 },
];

const currentUser: User = { id: 'current-user', name: 'Tú', avatar: 'current-user', lat: 34.054, lng: -118.242 };

const allUsers = [...users, currentUser];

const conversations: Conversation[] = [
  {
    id: 'conv-1',
    participant: users.find(u => u.id === 'user-1')!,
    unreadCount: 2,
    messages: [
      { id: 'msg-1-1', text: 'Hola, ¿cómo estás?', senderId: 'user-1', timestamp: '10:30 AM' },
      { id: 'msg-1-2', text: 'Estoy bien, ¡gracias! ¿Y tú?', senderId: 'current-user', timestamp: '10:31 AM' },
      { id: 'msg-1-3', text: '¡Genial! Vi que estabas cerca en LocalConnect.', senderId: 'user-1', timestamp: '10:32 AM' },
      { id: 'msg-1-4', text: '¡Sí! Esta aplicación es genial para encontrar gente.', senderId: 'current-user', timestamp: '10:33 AM' },
    ],
  },
  {
    id: 'conv-2',
    participant: users.find(u => u.id === 'user-2')!,
    unreadCount: 0,
    messages: [
      { id: 'msg-2-1', text: '¡Hola!', senderId: 'current-user', timestamp: 'Ayer' },
      { id: 'msg-2-2', text: '¡Hola! Encantado de conectar.', senderId: 'user-2', timestamp: 'Ayer' },
    ],
  },
  {
    id: 'conv-3',
    participant: users.find(u => u.id === 'user-3')!,
    unreadCount: 1,
    messages: [
      { id: 'msg-3-1', text: '¡Me gusta tu foto de perfil!', senderId: 'user-3', timestamp: 'Hace 3 días' },
    ],
  },
];

export const getMockUsers = () => users;
export const getMockCurrentUser = () => currentUser;
export const getMockConversations = () => conversations;
export const getMockConversationById = (id: string) => conversations.find(c => c.id === id);
export const getMockUserById = (id: string) => allUsers.find(u => u.id === id);
