from typing import Dict, Any, List, Optional
from datetime import datetime
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class CreateRequestInput(BaseModel):
    customer_id: str = Field(..., description="Customer ID for the request")
    subject: str = Field(..., description="Request subject/title")
    description: str = Field(..., description="Detailed description of the request")
    priority: Optional[str] = Field("normal", description="Priority level (low, normal, high, urgent)")
    category: Optional[str] = Field(None, description="Request category")


class AssignRequestInput(BaseModel):
    request_id: str = Field(..., description="Request ID to assign")
    user_id: str = Field(..., description="User ID to assign the request to")
    note: Optional[str] = Field(None, description="Note about the assignment")


class UpdateRequestStatusInput(BaseModel):
    request_id: str = Field(..., description="Request ID to update")
    status: str = Field(..., description="New status (pending, assigned, in_progress, completed, cancelled)")
    note: Optional[str] = Field(None, description="Note about the status change")


class ConvertToAppointmentInput(BaseModel):
    request_id: str = Field(..., description="Request ID to convert")
    scheduled_at: str = Field(..., description="Appointment date and time (ISO format)")
    duration_minutes: int = Field(60, description="Appointment duration in minutes")
    location: Optional[str] = Field(None, description="Appointment location")
    notes: Optional[str] = Field(None, description="Additional appointment notes")


class AddRequestNoteInput(BaseModel):
    request_id: str = Field(..., description="Request ID to add note to")
    note: str = Field(..., description="Note content to add")


class RequestTools:
    """Tools for managing service requests in BMS"""
    
    @staticmethod
    def list_tools() -> List[Tool]:
        """List available request management tools"""
        return [
            Tool(
                name="request_create",
                description="Create a new service request",
                inputSchema=CreateRequestInput.schema()
            ),
            Tool(
                name="request_assign",
                description="Assign a request to a user",
                inputSchema=AssignRequestInput.schema()
            ),
            Tool(
                name="request_update_status",
                description="Update request status",
                inputSchema=UpdateRequestStatusInput.schema()
            ),
            Tool(
                name="request_convert_to_appointment",
                description="Convert a request to an appointment",
                inputSchema=ConvertToAppointmentInput.schema()
            ),
            Tool(
                name="request_add_note",
                description="Add a note to a request",
                inputSchema=AddRequestNoteInput.schema()
            )
        ]
    
    @staticmethod
    async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> List[TextContent]:
        """Execute a request management tool"""
        try:
            if tool_name == "request_create":
                input_data = CreateRequestInput(**arguments)
                
                request_data = {
                    "customerId": input_data.customer_id,
                    "subject": input_data.subject,
                    "description": input_data.description,
                    "priority": input_data.priority,
                    "category": input_data.category,
                    "status": "pending"
                }
                
                result = await bms_client.create_request(request_data)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully created request '{input_data.subject}' with ID: {result['id']}"
                )]
                
            elif tool_name == "request_assign":
                input_data = AssignRequestInput(**arguments)
                
                result = await bms_client.assign_request(
                    input_data.request_id,
                    input_data.user_id
                )
                
                # Add note if provided
                if input_data.note:
                    note_data = {
                        "content": f"Assigned to user: {input_data.note}",
                        "type": "assignment"
                    }
                    await bms_client.update_request(
                        input_data.request_id,
                        {"notes": [note_data]}
                    )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully assigned request {input_data.request_id} to user {input_data.user_id}"
                )]
                
            elif tool_name == "request_update_status":
                input_data = UpdateRequestStatusInput(**arguments)
                
                update_data = {"status": input_data.status}
                
                # Add note if provided
                if input_data.note:
                    update_data["notes"] = [{
                        "content": f"Status changed to {input_data.status}: {input_data.note}",
                        "type": "status_change"
                    }]
                
                result = await bms_client.update_request(
                    input_data.request_id,
                    update_data
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully updated request {input_data.request_id} status to {input_data.status}"
                )]
                
            elif tool_name == "request_convert_to_appointment":
                input_data = ConvertToAppointmentInput(**arguments)
                
                # Parse and validate the scheduled time
                scheduled_dt = datetime.fromisoformat(input_data.scheduled_at.replace("Z", "+00:00"))
                
                appointment_data = {
                    "scheduledAt": scheduled_dt.isoformat(),
                    "duration": input_data.duration_minutes,
                    "location": input_data.location,
                    "notes": input_data.notes or "Converted from service request"
                }
                
                result = await bms_client.convert_request_to_appointment(
                    input_data.request_id,
                    appointment_data
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully converted request {input_data.request_id} to appointment scheduled at {scheduled_dt}"
                )]
                
            elif tool_name == "request_add_note":
                input_data = AddRequestNoteInput(**arguments)
                
                update_data = {
                    "notes": [{
                        "content": input_data.note,
                        "type": "general",
                        "createdAt": datetime.utcnow().isoformat()
                    }]
                }
                
                result = await bms_client.update_request(
                    input_data.request_id,
                    update_data
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully added note to request {input_data.request_id}"
                )]
                
            else:
                raise ValueError(f"Unknown request tool: {tool_name}")
                
        except Exception as e:
            logger.error(f"Error executing request tool {tool_name}: {e}")
            return [TextContent(
                type="text",
                text=f"Error executing {tool_name}: {str(e)}"
            )]


request_tools = RequestTools()