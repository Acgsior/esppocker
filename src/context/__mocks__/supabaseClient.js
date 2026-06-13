// Mock implementation of Supabase Client

export const mockCallbacks = {};

const mockChannel = {
  on: jest.fn().mockImplementation((type, filter, callback) => {
    if (type === 'postgres_changes') {
      if (filter.table === 'participants') mockCallbacks.participants = callback;
      if (filter.table === 'rooms') mockCallbacks.rooms = callback;
    } else if (type === 'broadcast') {
      if (filter.event === 'room_action') mockCallbacks.broadcast_room_action = callback;
      if (filter.event === 'force_refresh') mockCallbacks.broadcast_force_refresh = callback;
    }
    return mockChannel;
  }),
  subscribe: jest.fn().mockReturnThis(),
  send: jest.fn(),
  unsubscribe: jest.fn(),
};

export const supabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  
  channel: jest.fn().mockReturnValue(mockChannel),
  removeChannel: jest.fn(),
};

// Clear pending promises
export const clearSupabaseMocks = () => {
  supabase.single.mockReset();
  supabase.single.mockResolvedValue({ data: {}, error: null });
  supabase.maybeSingle.mockReset();
  supabase.maybeSingle.mockResolvedValue({ data: null, error: null });
  supabase.order.mockReset();
  supabase.order.mockReturnThis();
  supabase.eq.mockReset();
  supabase.eq.mockReturnThis();
  supabase.in.mockReset();
  supabase.in.mockReturnThis();
  supabase.update.mockReset();
  supabase.update.mockReturnThis();
  supabase.insert.mockReset();
  supabase.insert.mockReturnThis();
  supabase.delete.mockReset();
  supabase.delete.mockReturnThis();
};

// Helper to configure mock responses in tests
export const mockSupabaseResponse = (method, data, error = null) => {
  supabase[method].mockResolvedValueOnce({ data, error });
};
