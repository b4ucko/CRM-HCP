import os
import json
from dotenv import load_dotenv
# Load .env relative to this file's directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from backend.database import SessionLocal, Interaction



# Global LLM instance helper to avoid circular imports
def get_llm():
    api_key = os.getenv("GROQ_API_KEY")
    if api_key and api_key.startswith("sk-or-"):
        return ChatOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            model="meta-llama/llama-3.3-70b-instruct",
            temperature=0.1
        )
    else:
        # Default to Groq Llama 3.3
        return ChatGroq(
            groq_api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.1
        )

@tool
def log_interaction(meeting_description: str) -> str:
    """Takes a natural language description of a meeting and extracts key fields to update the form state.
    
    Args:
        meeting_description (str): Natural language summary of the meeting.
    """
    llm = get_llm()
    prompt = f"""
    Analyze the following description of a meeting with a Healthcare Professional (HCP) and extract:
    1. HCP Name (e.g., Dr. Alice Smith). Must use proper capitalization (Title Case).
    2. Date of meeting (format YYYY-MM-DD; if not specified, default to today's date "2026-07-15").
    3. Sentiment (must be exactly one of: "Positive", "Neutral", "Negative").
    4. Topics Discussed (list of strings). Capitalize the first letter of each word (Title Case) and use formal terminology (e.g., 'Skin Condition' instead of 'skin condition').
    5. Materials Shared (list of strings). Capitalize the first letter of each word (Title Case) (e.g., 'Research Paper' instead of 'research paper').

    Meeting Description:
    "{meeting_description}"

    Return ONLY a valid JSON object with the keys "hcp_name", "date", "sentiment", "topics", and "materials".
    Ensure no other text or explanation is returned.
    """
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        # Clean markdown formatting if present
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        extracted = json.loads(content)
        
        # Apply programmatic title casing to guarantee correct capitalization
        hcp_name = extracted.get("hcp_name")
        if hcp_name and isinstance(hcp_name, str):
            hcp_name = hcp_name.title()
            
        # Guarantee topics is a list of title-cased strings
        raw_topics = extracted.get("topics") or []
        if isinstance(raw_topics, str):
            raw_topics = [item.strip() for item in raw_topics.split(',') if item.strip()]
        topics = [t.title() for t in raw_topics if isinstance(t, str)]
        
        # Guarantee materials is a list of title-cased strings
        raw_materials = extracted.get("materials") or []
        if isinstance(raw_materials, str):
            raw_materials = [item.strip() for item in raw_materials.split(',') if item.strip()]
        materials = [m.title() for m in raw_materials if isinstance(m, str)]
        
        # Prepare special return structure for custom ToolNode interception
        update_payload = {
            "form_state_update": {
                "hcp_name": hcp_name,
                "date": extracted.get("date"),
                "sentiment": extracted.get("sentiment", "Neutral"),
                "topics": topics,
                "materials": materials,
            },
            "message": f"Successfully logged interaction details for {hcp_name} on {extracted.get('date')}."
        }
        return json.dumps(update_payload)
    except Exception as e:
        error_payload = {
            "message": f"Error parsing interaction description: {str(e)}"
        }
        return json.dumps(error_payload)

@tool
def edit_interaction(fields_to_update: dict, current_form_state: dict = None) -> str:
    """Takes specific field names and values to update in the form state, preserving the remaining fields.
    
    Args:
        fields_to_update (dict): Dictionary containing keys and new values (e.g., {"sentiment": "Negative"}).
        current_form_state (dict): The current form state (injected automatically).
    """
    if not current_form_state:
        current_form_state = {}
        
    allowed_keys = {"hcp_name", "date", "sentiment", "topics", "materials", "next_steps"}
    
    updated_state = current_form_state.copy()
    updated_fields = []
    
    for key, value in fields_to_update.items():
        if key in allowed_keys:
            # Enforce proper title casing and list structure for text inputs
            if key == "hcp_name" and isinstance(value, str):
                value = value.title()
            elif key in ["topics", "materials"]:
                if isinstance(value, str):
                    value = [item.strip().title() for item in value.split(',') if item.strip()]
                elif isinstance(value, list):
                    value = [item.title() for item in value if isinstance(item, str)]
                
            updated_state[key] = value
            updated_fields.append(key)
            
    update_payload = {
        "form_state_update": updated_state,
        "message": f"Successfully updated form field(s): {', '.join(updated_fields)}."
    }
    return json.dumps(update_payload)

@tool
def retrieve_hcp_history(hcp_name: str) -> str:
    """Queries the database for past interactions associated with the specified HCP name.
    
    Args:
        hcp_name (str): Name of the HCP to search.
    """
    db = SessionLocal()
    try:
        # Search for HCP (case-insensitive substring match)
        results = db.query(Interaction).filter(Interaction.hcp_name.ilike(f"%{hcp_name}%")).all()
        
        if not results:
            return json.dumps({
                "message": f"No past interaction history found for '{hcp_name}'."
            })
            
        history = []
        for r in results:
            history.append({
                "date": r.date,
                "sentiment": r.sentiment,
                "topics": json.loads(r.topics) if r.topics else [],
                "materials": json.loads(r.materials) if r.materials else [],
                "next_steps": r.next_steps
            })
            
        return json.dumps({
            "message": f"Found {len(history)} past interaction(s) for '{hcp_name}':\n" + json.dumps(history, indent=2)
        })
    except Exception as e:
        return json.dumps({
            "message": f"Error retrieving interaction history: {str(e)}"
        })
    finally:
        db.close()

@tool
def schedule_follow_up(date: str, topic: str, current_form_state: dict = None) -> str:
    """Extracts a date and topic for a follow-up meeting and updates the 'next_steps' field.
    
    Args:
        date (str): The date of the follow-up meeting.
        topic (str): The topic of discussion for the follow-up meeting.
        current_form_state (dict): The current form state (injected automatically).
    """
    if not current_form_state:
        current_form_state = {}
        
    formatted_topic = topic.title() if isinstance(topic, str) else topic
    next_steps_text = f"Follow-up scheduled on {date} to discuss '{formatted_topic}'."
    
    updated_state = current_form_state.copy()
    updated_state["next_steps"] = next_steps_text
    
    update_payload = {
        "form_state_update": {
            "next_steps": next_steps_text
        },
        "message": f"Scheduled follow-up on {date} about '{formatted_topic}'."
    }
    return json.dumps(update_payload)

@tool
def save_interaction_to_db(current_form_state: dict = None) -> str:
    """Saves the finalized form state data to the SQL database.
    
    Args:
        current_form_state (dict): The current form state (injected automatically).
    """
    if not current_form_state or not current_form_state.get("hcp_name"):
        return json.dumps({
            "message": "Cannot save interaction: HCP name is required to persist data."
        })
        
    db = SessionLocal()
    try:
        # Convert lists to JSON string
        topics_json = json.dumps(current_form_state.get("topics") or [])
        materials_json = json.dumps(current_form_state.get("materials") or [])
        
        interaction = Interaction(
            hcp_name=current_form_state.get("hcp_name"),
            date=current_form_state.get("date"),
            sentiment=current_form_state.get("sentiment") or "Neutral",
            topics=topics_json,
            materials=materials_json,
            next_steps=current_form_state.get("next_steps")
        )
        
        db.add(interaction)
        db.commit()
        
        return json.dumps({
            "message": "Interaction saved successfully to the database."
        })
    except Exception as e:
        db.rollback()
        return json.dumps({
            "message": f"Error saving interaction to database: {str(e)}"
        })
    finally:
        db.close()
