import os
import sys
import json
from dotenv import load_dotenv
# Load .env relative to this file's directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from typing import List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


from backend.database import get_db, init_db, Interaction
from backend.agent import graph

# Create FastAPI app
app = FastAPI(title="CRM HCP API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response serialization
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    form_state: Dict[str, Any]

class ChatResponse(BaseModel):
    ai_message: str
    form_state: Dict[str, Any]

class InteractionResponse(BaseModel):
    id: int
    hcp_name: str
    date: str
    sentiment: str
    topics: List[str]
    materials: List[str]
    next_steps: str
    created_at: str

# Database initialization on startup
@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"message": "CRM HCP Backend is running."}

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    """Processes chat message, invokes LangGraph agent, and returns the updated state."""
    try:
        # Convert history payload to LangChain message list
        messages = []
        for msg in payload.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
                
        # Append the new user message
        messages.append(HumanMessage(content=payload.message))
        
        # Prepare state for LangGraph execution
        # Initial form state from frontend or empty default
        form_state = payload.form_state or {
            "hcp_name": None,
            "date": None,
            "sentiment": "Neutral",
            "topics": [],
            "materials": [],
            "next_steps": None
        }
        
        initial_state = {
            "messages": messages,
            "form_state": form_state
        }
        
        # Execute LangGraph StateGraph
        final_state = graph.invoke(initial_state)
        
        # Retrieve updated form state and last AI message
        updated_messages = final_state.get("messages", [])
        updated_form_state = final_state.get("form_state", form_state)
        
        # Log execution details to the console for diagnosis
        try:
            print("=== LANGGRAPH Turn Execution Messages ===", flush=True)
            for idx, msg in enumerate(updated_messages):
                print(f"Message #{idx} | Type: {type(msg).__name__}", flush=True)
                content = getattr(msg, 'content', '')
                if isinstance(content, str):
                    # Avoid console encoding issues by replacing characters that cannot be encoded
                    safe_content = content.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8')
                    print(f"Content: {safe_content}", flush=True)
                else:
                    print(f"Content: {content}", flush=True)
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    print(f"Tool Calls: {msg.tool_calls}", flush=True)
                print("-" * 30, flush=True)
            print("=========================================", flush=True)
        except Exception as pe:
            # Console printing failures should not break the API request
            pass
        
        # Find the final text response from the assistant
        ai_message_text = "I processed your request, but couldn't generate a text response."
        for msg in reversed(updated_messages):
            if isinstance(msg, AIMessage) and msg.content:
                ai_message_text = msg.content
                break
                
        return ChatResponse(
            ai_message=ai_message_text,
            form_state=updated_form_state
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/interactions", response_model=List[InteractionResponse])
def get_interactions(db: Session = Depends(get_db)):
    """Fetches all saved interaction records from the SQLite database."""
    try:
        records = db.query(Interaction).order_by(Interaction.id.desc()).all()
        response = []
        for r in records:
            response.append(InteractionResponse(
                id=r.id,
                hcp_name=r.hcp_name or "",
                date=r.date or "",
                sentiment=r.sentiment or "Neutral",
                topics=json.loads(r.topics) if r.topics else [],
                materials=json.loads(r.materials) if r.materials else [],
                next_steps=r.next_steps or "",
                created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else ""
            ))
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database fetch error: {str(e)}")
