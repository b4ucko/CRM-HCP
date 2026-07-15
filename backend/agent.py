import json
from typing import TypedDict, Sequence, Annotated
from langchain_core.messages import BaseMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from backend.tools import (
    log_interaction,
    edit_interaction,
    retrieve_hcp_history,
    schedule_follow_up,
    save_interaction_to_db,
    get_llm
)

# Define the State graph structure
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    form_state: dict


# Build a mapping of tools
tools_list = [
    log_interaction,
    edit_interaction,
    retrieve_hcp_history,
    schedule_follow_up,
    save_interaction_to_db
]
tools_map = {tool.name: tool for tool in tools_list}

def agent_node(state: AgentState):
    """Invokes the LLM with a system message containing the current form state."""
    messages = list(state["messages"])
    form_state = state["form_state"]
    
    # Construct a comprehensive system prompt explaining the CRM scenario
    system_prompt = f"""You are an expert AI CRM Assistant for Healthcare Professional (HCP) interactions.
Your role is to help sales representatives log, update, review, and persist meeting details.

The user is viewing a split-screen layout. 
- Left Panel: "Interaction Details" Form. This form is strictly READ-ONLY. The user cannot type in it. They must talk to you to change it.
- Right Panel: AI Assistant Chat (You).

Here is the CURRENT FORM STATE:
{json.dumps(form_state, indent=2)}

Use your tools to coordinate actions:
1. When the user details a meeting (e.g. "I had a great chat with Dr. Bob Jones today about oncology, we shared the storage brochure"), invoke `log_interaction` to automatically extract the details and fill the form.
2. When the user requests direct edits (e.g. "Change the sentiment to positive" or "Add vaccine guidelines to materials"), invoke `edit_interaction` to update specific fields while preserving the rest.
3. When the user requests historical context (e.g. "What did we discuss with Dr. Alice Smith before?"), invoke `retrieve_hcp_history` to pull past records from the database.
4. When the user schedules a follow-up (e.g. "Set a follow-up for next week on patient enrollment"), invoke `schedule_follow_up`.
5. When the user is satisfied and says "Save", "Submit", "Looks good", or "Persist", invoke `save_interaction_to_db` to save this record.

Be professional, concise, and helpful. Always summarize the updates or historical details you've obtained to keep the user informed.
"""
    
    system_msg = SystemMessage(content=system_prompt)
    
    # Initialize LLM and bind tools
    llm = get_llm()
    llm_with_tools = llm.bind_tools(tools_list)
    
    response = llm_with_tools.invoke([system_msg] + messages)
    return {"messages": [response]}

def tools_node(state: AgentState):
    """Executes requested tool calls, updates the form state, and returns tool response messages."""
    messages = state["messages"]
    form_state = state["form_state"]
    last_message = messages[-1]
    
    new_messages = []
    updated_form_state = form_state.copy()
    
    if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
        return {"messages": [], "form_state": updated_form_state}
        
    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"].copy()
        tool_id = tool_call["id"]
        
        tool_func = tools_map.get(tool_name)
        if not tool_func:
            new_messages.append(
                ToolMessage(
                    content=f"Error: Tool '{tool_name}' not found.",
                    tool_call_id=tool_id,
                    name=tool_name
                )
            )
            continue
            
        # Inject current form state for tools that require context
        if tool_name in ["edit_interaction", "schedule_follow_up", "save_interaction_to_db"]:
            tool_args["current_form_state"] = updated_form_state
            
        try:
            # Execute tool (returns JSON string)
            result_str = tool_func.invoke(tool_args)
            result_data = json.loads(result_str)
            
            # If the tool updated the form state, merge it
            if "form_state_update" in result_data:
                for k, v in result_data["form_state_update"].items():
                    updated_form_state[k] = v
            
            # Use friendly message if provided, else fallback to raw output
            message_content = result_data.get("message", result_str)
            
            new_messages.append(
                ToolMessage(
                    content=message_content,
                    tool_call_id=tool_id,
                    name=tool_name
                )
            )
        except Exception as e:
            new_messages.append(
                ToolMessage(
                    content=f"Error running tool '{tool_name}': {str(e)}",
                    tool_call_id=tool_id,
                    name=tool_name
                )
            )
            
    return {"messages": new_messages, "form_state": updated_form_state}

def should_continue(state: AgentState):
    """Determines whether to execute tools or end the current turn."""
    messages = state["messages"]
    last_message = messages[-1]
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# Build and compile the StateGraph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tools_node)

# Set entry point
workflow.set_entry_point("agent")

# Add conditional edge from agent to either tools or END
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)

# Add edge from tools back to agent
workflow.add_edge("tools", "agent")

# Compile graph
graph = workflow.compile()
