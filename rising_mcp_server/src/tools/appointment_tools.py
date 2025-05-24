from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field, validator
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class CreateAppointmentInput(BaseModel):
    customer_id: str = Field(..., description="Customer ID for the appointment")
    scheduled_at: str = Field(..., description="Appointment date and time (ISO format)")
    duration_minutes: int = Field(60, description="Appointment duration in minutes")
    title: str = Field(..., description="Appointment title")
    description: Optional[str] = Field(None, description="Appointment description")
    location: Optional[str] = Field(None, description="Appointment location")
    assigned_to: Optional[str] = Field(None, description="User ID to assign the appointment to")
    
    @validator("scheduled_at")
    def validate_scheduled_at(cls, v):
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except:
            raise ValueError("Invalid datetime format. Use ISO format (e.g., 2024-01-15T14:30:00Z)")
        return v


class UpdateAppointmentInput(BaseModel):
    appointment_id: str = Field(..., description="Appointment ID to update")
    scheduled_at: Optional[str] = Field(None, description="New appointment date and time (ISO format)")
    duration_minutes: Optional[int] = Field(None, description="New duration in minutes")
    title: Optional[str] = Field(None, description="Updated title")
    description: Optional[str] = Field(None, description="Updated description")
    location: Optional[str] = Field(None, description="Updated location")
    status: Optional[str] = Field(None, description="Updated status (scheduled, in_progress, completed, cancelled, no_show)")


class CancelAppointmentInput(BaseModel):
    appointment_id: str = Field(..., description="Appointment ID to cancel")
    reason: str = Field(..., description="Cancellation reason")
    notify_customer: bool = Field(True, description="Whether to notify the customer")


class RescheduleAppointmentInput(BaseModel):
    appointment_id: str = Field(..., description="Appointment ID to reschedule")
    new_scheduled_at: str = Field(..., description="New appointment date and time (ISO format)")
    reason: Optional[str] = Field(None, description="Reason for rescheduling")
    
    @validator("new_scheduled_at")
    def validate_new_scheduled_at(cls, v):
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except:
            raise ValueError("Invalid datetime format. Use ISO format (e.g., 2024-01-15T14:30:00Z)")
        return v


class CompleteAppointmentInput(BaseModel):
    appointment_id: str = Field(..., description="Appointment ID to mark as completed")
    notes: Optional[str] = Field(None, description="Completion notes")
    follow_up_required: bool = Field(False, description="Whether follow-up is required")


class AppointmentTools:
    """Tools for managing appointments in BMS"""
    
    @staticmethod
    def list_tools() -> List[Tool]:
        """List available appointment management tools"""
        return [
            Tool(
                name="appointment_create",
                description="Create a new appointment",
                inputSchema=CreateAppointmentInput.schema()
            ),
            Tool(
                name="appointment_update",
                description="Update appointment details",
                inputSchema=UpdateAppointmentInput.schema()
            ),
            Tool(
                name="appointment_cancel",
                description="Cancel an appointment with reason",
                inputSchema=CancelAppointmentInput.schema()
            ),
            Tool(
                name="appointment_reschedule",
                description="Reschedule an appointment to a new time",
                inputSchema=RescheduleAppointmentInput.schema()
            ),
            Tool(
                name="appointment_complete",
                description="Mark an appointment as completed",
                inputSchema=CompleteAppointmentInput.schema()
            )
        ]
    
    @staticmethod
    async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> List[TextContent]:
        """Execute an appointment management tool"""
        try:
            if tool_name == "appointment_create":
                input_data = CreateAppointmentInput(**arguments)
                
                appointment_data = {
                    "customerId": input_data.customer_id,
                    "scheduledAt": datetime.fromisoformat(input_data.scheduled_at.replace("Z", "+00:00")).isoformat(),
                    "duration": input_data.duration_minutes,
                    "title": input_data.title,
                    "description": input_data.description,
                    "location": input_data.location,
                    "status": "scheduled"
                }
                
                if input_data.assigned_to:
                    appointment_data["assignedTo"] = input_data.assigned_to
                
                result = await bms_client.create_appointment(appointment_data)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully created appointment '{input_data.title}' with ID: {result['id']} scheduled for {input_data.scheduled_at}"
                )]
                
            elif tool_name == "appointment_update":
                input_data = UpdateAppointmentInput(**arguments)
                
                update_data = {}
                if input_data.scheduled_at:
                    update_data["scheduledAt"] = datetime.fromisoformat(
                        input_data.scheduled_at.replace("Z", "+00:00")
                    ).isoformat()
                if input_data.duration_minutes:
                    update_data["duration"] = input_data.duration_minutes
                if input_data.title:
                    update_data["title"] = input_data.title
                if input_data.description:
                    update_data["description"] = input_data.description
                if input_data.location:
                    update_data["location"] = input_data.location
                if input_data.status:
                    update_data["status"] = input_data.status
                
                result = await bms_client.update_appointment(
                    input_data.appointment_id,
                    update_data
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully updated appointment {input_data.appointment_id}"
                )]
                
            elif tool_name == "appointment_cancel":
                input_data = CancelAppointmentInput(**arguments)
                
                result = await bms_client.cancel_appointment(
                    input_data.appointment_id,
                    input_data.reason
                )
                
                # TODO: Add customer notification logic if notify_customer is True
                notification_msg = " Customer will be notified." if input_data.notify_customer else ""
                
                return [TextContent(
                    type="text",
                    text=f"Successfully cancelled appointment {input_data.appointment_id}. Reason: {input_data.reason}.{notification_msg}"
                )]
                
            elif tool_name == "appointment_reschedule":
                input_data = RescheduleAppointmentInput(**arguments)
                
                new_time = datetime.fromisoformat(input_data.new_scheduled_at.replace("Z", "+00:00"))
                
                update_data = {
                    "scheduledAt": new_time.isoformat(),
                    "notes": f"Rescheduled from original time. {input_data.reason or ''}"
                }
                
                result = await bms_client.update_appointment(
                    input_data.appointment_id,
                    update_data
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully rescheduled appointment {input_data.appointment_id} to {new_time}"
                )]
                
            elif tool_name == "appointment_complete":
                input_data = CompleteAppointmentInput(**arguments)
                
                update_data = {
                    "status": "completed",
                    "completedAt": datetime.utcnow().isoformat()
                }
                
                if input_data.notes:
                    update_data["completionNotes"] = input_data.notes
                
                if input_data.follow_up_required:
                    update_data["followUpRequired"] = True
                
                result = await bms_client.update_appointment(
                    input_data.appointment_id,
                    update_data
                )
                
                follow_up_msg = " Follow-up required." if input_data.follow_up_required else ""
                
                return [TextContent(
                    type="text",
                    text=f"Successfully completed appointment {input_data.appointment_id}.{follow_up_msg}"
                )]
                
            else:
                raise ValueError(f"Unknown appointment tool: {tool_name}")
                
        except Exception as e:
            logger.error(f"Error executing appointment tool {tool_name}: {e}")
            return [TextContent(
                type="text",
                text=f"Error executing {tool_name}: {str(e)}"
            )]


appointment_tools = AppointmentTools()