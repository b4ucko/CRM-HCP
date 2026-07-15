import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = 'http://localhost:8000';

// Async thunk to send a message to the FastAPI agent
export const sendMessage = createAsyncThunk(
  'crm/sendMessage',
  async (messageText, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState().crm;
      
      // Map frontend chat history to backend request format
      const history = state.messages
        .filter(m => m.id !== 'welcome') // Skip initial welcome message
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          history,
          form_state: state.formState
        })
      });

      if (!response.ok) {
        throw new Error('Failed to communicate with AI Assistant');
      }

      const data = await response.json();
      
      // If the tool has saved the interaction, update the saved list
      // We can check if the response message includes "saved successfully" 
      // or simply re-fetch saved records on every chat interaction to be safe.
      dispatch(fetchSavedInteractions());
      
      return data; // returns { ai_message, form_state }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch all saved interactions
export const fetchSavedInteractions = createAsyncThunk(
  'crm/fetchSavedInteractions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/interactions`);
      if (!response.ok) {
        throw new Error('Failed to fetch interactions database');
      }
      return await response.json(); // returns array of saved interactions
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const crmSlice = createSlice({
  name: 'crm',
  initialState: {
    messages: [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hello! I am your AI CRM Assistant. I control the 'Interaction Details' form on the left. Since the form is read-only, you can tell me about your meetings (e.g. HCP name, date, topic, sentiment, materials shared), and I'll populate the form, schedule follow-ups, or save details to the database for you. How can I help today?"
      }
    ],
    formState: {
      hcp_name: '',
      date: '',
      sentiment: 'Neutral',
      topics: [],
      materials: [],
      next_steps: ''
    },
    savedList: [],
    loading: false,
    error: null
  },
  reducers: {
    clearForm: (state) => {
      state.formState = {
        hcp_name: '',
        date: '',
        sentiment: 'Neutral',
        topics: [],
        materials: [],
        next_steps: ''
      };
    },
    addLocalUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now().toString(),
        sender: 'user',
        text: action.payload
      });
    },
    clearChat: (state) => {
      state.messages = [
        {
          id: 'welcome',
          sender: 'assistant',
          text: "Hello! I am your AI CRM Assistant. I control the 'Interaction Details' form on the left. Since the form is read-only, you can tell me about your meetings (e.g. HCP name, date, topic, sentiment, materials shared), and I'll populate the form, schedule follow-ups, or save details to the database for you. How can I help today?"
        }
      ];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Send Message Thunk
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          id: Date.now().toString(),
          sender: 'assistant',
          text: action.payload.ai_message
        });
        state.formState = action.payload.form_state;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
        state.messages.push({
          id: Date.now().toString(),
          sender: 'assistant',
          text: "I encountered a communication error with my backend service. Please verify the backend is running and that your GROQ_API_KEY is configured."
        });
      })
      // Fetch Saved Interactions Thunk
      .addCase(fetchSavedInteractions.fulfilled, (state, action) => {
        state.savedList = action.payload;
      });
  }
});

export const { clearForm, addLocalUserMessage, clearChat } = crmSlice.actions;

export const store = configureStore({
  reducer: {
    crm: crmSlice.reducer
  }
});
